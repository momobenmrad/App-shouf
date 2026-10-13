-- Chouf — media assets, transcoding jobs, catalog (titles, seasons, episodes, genres).

create type public.asset_status as enum ('uploading', 'uploaded', 'queued', 'processing', 'ready', 'failed');
create type public.job_status as enum ('queued', 'active', 'completed', 'failed');
create type public.title_kind as enum ('movie', 'series');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  status public.asset_status not null default 'uploading',
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  source_key text not null unique,
  upload_id text,
  hls_prefix text,
  duration_seconds integer check (duration_seconds >= 0),
  width integer,
  height integer,
  renditions jsonb not null default '[]',
  progress smallint not null default 0 check (progress between 0 and 100),
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_assets_status_idx on public.media_assets (status);

create trigger media_assets_updated_at before update on public.media_assets
  for each row execute function public.set_updated_at();

create table public.transcode_jobs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  queue_job_id text,
  status public.job_status not null default 'queued',
  attempt integer not null default 1,
  started_at timestamptz,
  finished_at timestamptz,
  log text,
  created_at timestamptz not null default now()
);

create index transcode_jobs_asset_idx on public.transcode_jobs (asset_id, created_at desc);

create table public.subtitle_tracks (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  lang text not null check (lang ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  label text not null,
  path text not null,
  is_default boolean not null default false,
  unique (asset_id, lang)
);

-- Search normalisation: lower-case, strip Latin accents, unify Arabic alef/teh marbuta/yeh forms
-- and drop tashkeel + tatweel, so "demonstration" matches "Démonstration" and "احمد" matches "أحمد".
create function public.normalize_search(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select translate(
    lower(value),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿأإآٱةىًٌٍَُِّْـ',
    'aaaaaaceeeeiiiinooooouuuuyyااااهي'
  );
$$;

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  kind public.title_kind not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  name jsonb not null check (public.is_i18n_text(name)),
  synopsis jsonb not null default '{}' check (synopsis = '{}' or public.is_i18n_text(synopsis)),
  release_year integer check (release_year between 1900 and 2100),
  maturity_rating text not null default 'all' check (maturity_rating in ('all', '10+', '12+', '16+', '18+')),
  poster_path text,
  backdrop_path text,
  access public.access_level not null default 'subscriber',
  status public.publish_status not null default 'draft',
  featured boolean not null default false,
  -- ISO 3166-1 alpha-2 codes; empty array = available everywhere.
  geo_allow text[] not null default '{}'
    check (array_to_string(geo_allow, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  asset_id uuid references public.media_assets (id) on delete set null,
  duration_seconds integer,
  published_at timestamptz,
  search_text text generated always as (
    public.normalize_search(
      coalesce(name ->> 'ar', '') || ' ' || coalesce(name ->> 'fr', '') || ' ' || coalesce(name ->> 'en', '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint titles_series_has_no_asset check (kind = 'movie' or asset_id is null)
);

create index titles_published_idx on public.titles (status, published_at desc);
create index titles_search_trgm_idx on public.titles using gin (search_text extensions.gin_trgm_ops);

create trigger titles_updated_at before update on public.titles
  for each row execute function public.set_updated_at();

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n_text(name))
);

create table public.title_genres (
  title_id uuid not null references public.titles (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (title_id, genre_id)
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles (id) on delete cascade,
  number integer not null check (number > 0),
  name jsonb not null default '{}' check (name = '{}' or public.is_i18n_text(name)),
  created_at timestamptz not null default now(),
  unique (title_id, number)
);

create table public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  number integer not null check (number > 0),
  name jsonb not null check (public.is_i18n_text(name)),
  synopsis jsonb not null default '{}' check (synopsis = '{}' or public.is_i18n_text(synopsis)),
  -- null = inherit the title's access level.
  access public.access_level,
  status public.publish_status not null default 'draft',
  asset_id uuid references public.media_assets (id) on delete set null,
  duration_seconds integer,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, number)
);

create trigger episodes_updated_at before update on public.episodes
  for each row execute function public.set_updated_at();

-- Viewers cannot read media_assets, so the playable duration is denormalised onto titles/episodes.
create function public.copy_asset_duration()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.asset_id is null then
    new.duration_seconds = null;
  elsif tg_op = 'INSERT' or new.asset_id is distinct from old.asset_id then
    select duration_seconds into new.duration_seconds from public.media_assets where id = new.asset_id;
  end if;
  return new;
end;
$$;

create trigger titles_copy_duration before insert or update of asset_id on public.titles
  for each row execute function public.copy_asset_duration();
create trigger episodes_copy_duration before insert or update of asset_id on public.episodes
  for each row execute function public.copy_asset_duration();

create function public.sync_asset_duration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.titles set duration_seconds = new.duration_seconds where asset_id = new.id;
  update public.episodes set duration_seconds = new.duration_seconds where asset_id = new.id;
  return null;
end;
$$;

create trigger media_assets_sync_duration after update of duration_seconds on public.media_assets
  for each row when (new.duration_seconds is distinct from old.duration_seconds)
  execute function public.sync_asset_duration();

-- Sets published_at the first time a title is published.
create function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger titles_stamp_published before insert or update of status on public.titles
  for each row execute function public.stamp_published_at();

-- Fuzzy search over published titles (any interface language).
create function public.search_titles(q text, max_results integer default 20)
returns setof public.titles
language sql
stable
set search_path = public, extensions
as $$
  with needle as (select public.normalize_search(trim(q)) as v)
  select t.*
  from public.titles t, needle
  where t.status = 'published'
    and length(needle.v) > 0
    and (
      needle.v <% t.search_text
      or strpos(t.search_text, needle.v) > 0
    )
  order by word_similarity(needle.v, t.search_text) desc, t.published_at desc
  limit least(greatest(max_results, 1), 50);
$$;

-- RLS ------------------------------------------------------------------------------------------

alter table public.media_assets enable row level security;
alter table public.transcode_jobs enable row level security;
alter table public.subtitle_tracks enable row level security;
alter table public.titles enable row level security;
alter table public.genres enable row level security;
alter table public.title_genres enable row level security;
alter table public.seasons enable row level security;
alter table public.episodes enable row level security;

create policy "media_assets: admin" on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());
create policy "transcode_jobs: admin" on public.transcode_jobs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "subtitle_tracks: read when attached to published content" on public.subtitle_tracks
  for select using (
    exists (select 1 from public.titles t where t.asset_id = subtitle_tracks.asset_id and t.status = 'published')
    or exists (
      select 1 from public.episodes e
      join public.seasons s on s.id = e.season_id
      join public.titles t on t.id = s.title_id
      where e.asset_id = subtitle_tracks.asset_id and e.status = 'published' and t.status = 'published'
    )
  );
create policy "subtitle_tracks: admin" on public.subtitle_tracks
  for all using (public.is_admin()) with check (public.is_admin());

create policy "titles: read published" on public.titles
  for select using (status = 'published');
create policy "titles: admin" on public.titles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "genres: read" on public.genres for select using (true);
create policy "genres: admin" on public.genres
  for all using (public.is_admin()) with check (public.is_admin());

create policy "title_genres: read" on public.title_genres for select using (true);
create policy "title_genres: admin" on public.title_genres
  for all using (public.is_admin()) with check (public.is_admin());

create policy "seasons: read when title published" on public.seasons
  for select using (
    exists (select 1 from public.titles t where t.id = seasons.title_id and t.status = 'published')
  );
create policy "seasons: admin" on public.seasons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "episodes: read published" on public.episodes
  for select using (
    status = 'published'
    and exists (
      select 1 from public.seasons s join public.titles t on t.id = s.title_id
      where s.id = episodes.season_id and t.status = 'published'
    )
  );
create policy "episodes: admin" on public.episodes
  for all using (public.is_admin()) with check (public.is_admin());
