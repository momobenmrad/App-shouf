-- Chouf — Phase 3: electronic programme guide for 24/7 channels (XMLTV import).

alter table public.channels
  -- Where the nightly import fetches this channel's XMLTV (file may contain several channels).
  add column epg_url text check (epg_url ~ '^https?://'),
  -- The <channel id="…"> value inside that XMLTV.
  add column epg_channel_id text,
  add column epg_updated_at timestamptz;

create table public.epg_programs (
  id bigint generated always as identity primary key,
  channel_id uuid not null references public.channels (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title jsonb not null check (public.is_i18n_text(title)),
  description jsonb not null default '{}' check (description = '{}' or public.is_i18n_text(description)),
  category text,
  rating text,
  external_id text,
  constraint epg_programs_valid_range check (end_at > start_at),
  -- One programme per channel and start time: re-imports replace instead of duplicating.
  unique (channel_id, start_at)
);

create index epg_programs_window_idx on public.epg_programs (channel_id, end_at);

-- What is on now and next on every active channel.
create function public.epg_now_next(p_at timestamptz default now())
returns table (channel_id uuid, now_title jsonb, now_start timestamptz, now_end timestamptz, next_title jsonb, next_start timestamptz)
language sql
stable
set search_path = ''
as $$
  select c.id,
         n.title, n.start_at, n.end_at,
         x.title, x.start_at
  from public.channels c
  left join lateral (
    select title, start_at, end_at from public.epg_programs p
    where p.channel_id = c.id and p.start_at <= p_at and p.end_at > p_at
    order by start_at desc limit 1
  ) n on true
  left join lateral (
    select title, start_at from public.epg_programs p
    where p.channel_id = c.id and p.start_at > p_at
    order by start_at limit 1
  ) x on true
  where c.status = 'active';
$$;

alter table public.epg_programs enable row level security;

create policy "epg_programs: read for active channels" on public.epg_programs
  for select using (exists (select 1 from public.channels c where c.id = epg_programs.channel_id and c.status = 'active'));
create policy "epg_programs: admin" on public.epg_programs
  for all using (public.is_admin()) with check (public.is_admin());
