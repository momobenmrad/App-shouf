-- Chouf — Phase 2: live events (own ingest), chat, live playback sessions, source monitoring state.

create type public.live_event_status as enum ('scheduled', 'live', 'ended');

-- Live events ingested through MediaMTX. The stream key is stored hashed; shown once to the admin.
create table public.live_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name jsonb not null check (public.is_i18n_text(name)),
  description jsonb not null default '{}' check (description = '{}' or public.is_i18n_text(description)),
  poster_path text,
  access public.access_level not null default 'subscriber',
  geo_allow text[] not null default '{}'
    check (array_to_string(geo_allow, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  published boolean not null default false,
  status public.live_event_status not null default 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  -- MediaMTX path, e.g. "live/finale-2026".
  stream_path text not null unique check (stream_path ~ '^live/[a-z0-9]+(-[a-z0-9]+)*$'),
  chat_enabled boolean not null default true,
  record boolean not null default true,
  replay_asset_id uuid references public.media_assets (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index live_events_public_idx on public.live_events (published, status, scheduled_at desc);

create trigger live_events_updated_at before update on public.live_events
  for each row execute function public.set_updated_at();

-- Stream keys live apart from the event row: RLS with no policy = service role only.
create table public.live_event_keys (
  event_id uuid primary key references public.live_events (id) on delete cascade,
  key_hash text not null,
  rotated_at timestamptz not null default now()
);

-- Called by the gateway (service role) for MediaMTX publish authentication.
create function public.authorize_live_publish(p_path text, p_key text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select e.id from public.live_events e
  join public.live_event_keys k on k.event_id = e.id
  where e.stream_path = p_path
    and e.status <> 'ended'
    and k.key_hash = encode(sha256(convert_to(p_key, 'utf8')), 'hex')
  limit 1;
$$;

revoke execute on function public.authorize_live_publish(text, text) from public, anon, authenticated;

-- Chat ---------------------------------------------------------------------------------------

create table public.chat_messages (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.live_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null default '',
  body text not null check (char_length(trim(body)) between 1 and 300),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id) on delete set null
);

create index chat_messages_event_idx on public.chat_messages (event_id, created_at desc);
create index chat_messages_rate_idx on public.chat_messages (user_id, created_at desc);

-- Stamps the author's display name and enforces 5 messages per 10 seconds per user.
create function public.prepare_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recent integer;
begin
  select count(*) into v_recent from public.chat_messages
    where user_id = new.user_id and created_at > now() - interval '10 seconds';
  if v_recent >= 5 then
    raise exception 'chat_rate_limited' using errcode = 'CH002';
  end if;
  select coalesce(display_name, 'viewer') into new.display_name from public.profiles where id = new.user_id;
  new.body = trim(new.body);
  new.created_at = now();
  new.deleted_at = null;
  new.deleted_by = null;
  return new;
end;
$$;

create trigger chat_messages_prepare before insert on public.chat_messages
  for each row execute function public.prepare_chat_message();

-- Live playback sessions -----------------------------------------------------------------------

alter table public.playback_sessions
  add column event_id uuid references public.live_events (id) on delete cascade;

alter table public.playback_sessions drop constraint playback_sessions_target;
alter table public.playback_sessions add constraint playback_sessions_target
  check (num_nonnulls(asset_id, channel_id, event_id) = 1);

drop function public.open_playback_session(uuid, uuid, uuid, text, text, integer, interval);

create function public.open_playback_session(
  p_user_id uuid,
  p_asset_id uuid,
  p_channel_id uuid,
  p_event_id uuid,
  p_device_id text,
  p_country text,
  p_max_streams integer,
  p_stale_after interval default interval '60 seconds'
)
returns public.playback_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.playback_sessions;
  v_live integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.playback_sessions set ended_at = now()
    where user_id = p_user_id and ended_at is null
      and (last_heartbeat_at < now() - p_stale_after or device_id = p_device_id);

  select count(*) into v_live from public.playback_sessions
    where user_id = p_user_id and ended_at is null;

  if v_live >= p_max_streams then
    raise exception 'too_many_streams' using errcode = 'CH001';
  end if;

  insert into public.playback_sessions (user_id, asset_id, channel_id, event_id, device_id, country)
  values (p_user_id, p_asset_id, p_channel_id, p_event_id, p_device_id, p_country)
  returning * into v_session;

  return v_session;
end;
$$;

revoke execute on function public.open_playback_session(uuid, uuid, uuid, uuid, text, text, integer, interval)
  from public, anon, authenticated;

-- Source monitoring state (stall detection needs the previous observation) --------------------

alter table public.channel_sources
  add column last_media_sequence bigint,
  add column last_sequence_change_at timestamptz,
  add column last_latency_ms integer,
  add column last_bitrate_kbps integer,
  add column last_error text;

-- RLS ------------------------------------------------------------------------------------------

alter table public.live_events enable row level security;
alter table public.live_event_keys enable row level security;
alter table public.chat_messages enable row level security;

create policy "live_events: read published" on public.live_events
  for select using (published);
create policy "live_events: admin" on public.live_events
  for all using (public.is_admin()) with check (public.is_admin());

-- No policy on live_event_keys: only the service role (gateway, admin key rotation) can touch it.
revoke all on public.live_event_keys from anon, authenticated;

create policy "chat_messages: read live chat" on public.chat_messages
  for select using (
    public.is_admin()
    or (deleted_at is null and exists (
      select 1 from public.live_events e
      where e.id = chat_messages.event_id and e.published and e.chat_enabled
    ))
  );
create policy "chat_messages: post as self while live" on public.chat_messages
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.live_events e
      where e.id = chat_messages.event_id and e.published and e.chat_enabled and e.status = 'live'
    )
  );
create policy "chat_messages: admin moderates" on public.chat_messages
  for update using (public.is_admin()) with check (public.is_admin());

revoke insert on public.chat_messages from anon, authenticated;
grant insert (event_id, user_id, body) on public.chat_messages to authenticated;

-- Realtime: chat, live status, admin health dashboards.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_messages, public.live_events,
      public.channels, public.channel_sources, public.source_incidents;
  end if;
end;
$$;
