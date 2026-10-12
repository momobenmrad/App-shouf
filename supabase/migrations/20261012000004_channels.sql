-- Chouf — live channels fed by licensed sources, health monitoring and incidents.
-- Schema ships in Phase 1; the monitor worker and the live gateway arrive in Phase 2.

create type public.channel_status as enum ('active', 'inactive');
create type public.source_kind as enum ('external_hls', 'internal_ingest');
create type public.source_health as enum ('unknown', 'healthy', 'degraded', 'down');
create type public.incident_kind as enum ('down', 'degraded', 'failover', 'failback', 'license_expired', 'all_sources_down');

-- license_info = { holder, agreement_ref, expires_at: 'YYYY-MM-DD', territories: ['TN', ...], notes? }
create function public.is_valid_license_info(info jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(info) = 'object'
    and length(trim(info ->> 'holder')) > 0
    and length(trim(info ->> 'agreement_ref')) > 0
    and (info ->> 'expires_at') ~ '^\d{4}-\d{2}-\d{2}$'
    and jsonb_typeof(info -> 'territories') = 'array'
    and jsonb_array_length(info -> 'territories') > 0
    and not jsonb_path_exists(info -> 'territories', '$[*] ? (!(@ like_regex "^[A-Z]{2}$"))'),
    false
  );
$$;

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n_text(name)),
  logo_path text,
  category text not null check (category in ('general', 'news', 'sports', 'kids', 'entertainment', 'religious', 'music', 'documentary')),
  country text not null check (country ~ '^[A-Z]{2}$'),
  language text not null check (language ~ '^[a-z]{2}$'),
  status public.channel_status not null default 'inactive',
  access public.access_level not null default 'subscriber',
  active_source_id uuid,
  auto_disabled_reason text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger channels_updated_at before update on public.channels
  for each row execute function public.set_updated_at();

create table public.channel_sources (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  kind public.source_kind not null,
  -- Never exposed to viewers: only the gateway (service role) reads it.
  url text not null check (url ~ '^https?://'),
  priority smallint not null check (priority > 0),
  enabled boolean not null default true,
  license_info jsonb not null check (public.is_valid_license_info(license_info)),
  health public.source_health not null default 'unknown',
  consecutive_failures integer not null default 0,
  consecutive_successes integer not null default 0,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, priority)
);

create trigger channel_sources_updated_at before update on public.channel_sources
  for each row execute function public.set_updated_at();

alter table public.channels
  add constraint channels_active_source_fk
  foreign key (active_source_id) references public.channel_sources (id) on delete set null;

create table public.source_health_checks (
  id bigint generated always as identity primary key,
  source_id uuid not null references public.channel_sources (id) on delete cascade,
  checked_at timestamptz not null default now(),
  ok boolean not null,
  http_status smallint,
  latency_ms integer,
  bitrate_kbps integer,
  error text
);

create index source_health_checks_source_idx on public.source_health_checks (source_id, checked_at desc);

create table public.source_incidents (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels (id) on delete cascade,
  source_id uuid references public.channel_sources (id) on delete set null,
  kind public.incident_kind not null,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  details jsonb not null default '{}'
);

create index source_incidents_open_idx on public.source_incidents (channel_id) where resolved_at is null;

alter table public.playback_sessions
  add constraint playback_sessions_channel_fk
  foreign key (channel_id) references public.channels (id) on delete cascade;

-- RLS ------------------------------------------------------------------------------------------

alter table public.channels enable row level security;
alter table public.channel_sources enable row level security;
alter table public.source_health_checks enable row level security;
alter table public.source_incidents enable row level security;

create policy "channels: read active" on public.channels for select using (status = 'active');
create policy "channels: admin" on public.channels
  for all using (public.is_admin()) with check (public.is_admin());

create policy "channel_sources: admin" on public.channel_sources
  for all using (public.is_admin()) with check (public.is_admin());
create policy "source_health_checks: admin" on public.source_health_checks
  for select using (public.is_admin());
create policy "source_incidents: admin" on public.source_incidents
  for all using (public.is_admin()) with check (public.is_admin());

-- Defence in depth: anonymous clients get no privileges at all on source tables.
revoke all on public.channel_sources, public.source_health_checks, public.source_incidents from anon;
