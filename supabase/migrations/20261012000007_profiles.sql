-- Chouf — Phase 3: multiple viewer profiles per account (kids profiles filter by maturity rating).

create table public.viewer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 30),
  -- Short emoji/letter shown on the avatar tile, plus a hue so profiles are distinguishable.
  avatar text not null default '🙂' check (char_length(avatar) between 1 and 8),
  color smallint not null default 0 check (color between 0 and 359),
  is_kids boolean not null default false,
  -- Highest rating the profile may see.
  maturity_max text not null default '18+' check (maturity_max in ('all', '10+', '12+', '16+', '18+')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index viewer_profiles_user_idx on public.viewer_profiles (user_id, created_at);
create unique index viewer_profiles_one_default_idx on public.viewer_profiles (user_id) where is_default;

create trigger viewer_profiles_updated_at before update on public.viewer_profiles
  for each row execute function public.set_updated_at();

create function public.maturity_rank(rating text)
returns smallint
language sql
immutable
set search_path = ''
as $$
  select case rating when 'all' then 0 when '10+' then 1 when '12+' then 2 when '16+' then 3 else 4 end::smallint;
$$;

-- At most 5 profiles per account; kids profiles are capped at 12+.
create function public.check_viewer_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.viewer_profiles where user_id = new.user_id) >= 5 then
    raise exception 'profile_limit' using errcode = 'CH003';
  end if;
  if new.is_kids and public.maturity_rank(new.maturity_max) > public.maturity_rank('12+') then
    new.maturity_max = '12+';
  end if;
  new.name = trim(new.name);
  return new;
end;
$$;

create trigger viewer_profiles_check before insert or update on public.viewer_profiles
  for each row execute function public.check_viewer_profile();

-- Every account gets a default profile at signup.
create function public.create_default_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.viewer_profiles (user_id, name, is_default)
  values (new.id, coalesce(nullif(new.display_name, ''), 'Profil 1'), true);
  return new;
end;
$$;

create trigger profiles_create_default_profile after insert on public.profiles
  for each row execute function public.create_default_profile();

-- Backfill existing accounts.
insert into public.viewer_profiles (user_id, name, is_default)
select p.id, coalesce(nullif(p.display_name, ''), 'Profil 1'), true
from public.profiles p
where not exists (select 1 from public.viewer_profiles v where v.user_id = p.id);

-- Playback progress becomes per profile ---------------------------------------------------------

alter table public.playback_progress add column profile_id uuid references public.viewer_profiles (id) on delete cascade;

update public.playback_progress pp
set profile_id = v.id
from public.viewer_profiles v
where v.user_id = pp.user_id and v.is_default;

alter table public.playback_progress alter column profile_id set not null;
alter table public.playback_progress drop constraint playback_progress_pkey;
alter table public.playback_progress add primary key (profile_id, asset_id);
drop index if exists public.playback_progress_recent_idx;
create index playback_progress_recent_idx on public.playback_progress (profile_id, updated_at desc);

-- The profile must belong to the row's user.
create function public.check_progress_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.viewer_profiles where id = new.profile_id and user_id = new.user_id) then
    raise exception 'profile_mismatch' using errcode = 'CH004';
  end if;
  return new;
end;
$$;

create trigger playback_progress_check_profile before insert or update on public.playback_progress
  for each row execute function public.check_progress_profile();

alter table public.playback_sessions add column profile_id uuid references public.viewer_profiles (id) on delete set null;

-- RLS ------------------------------------------------------------------------------------------

alter table public.viewer_profiles enable row level security;

create policy "viewer_profiles: own" on public.viewer_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "viewer_profiles: admin read" on public.viewer_profiles
  for select using (public.is_admin());
