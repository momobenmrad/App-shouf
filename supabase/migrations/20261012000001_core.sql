-- Chouf — core: extensions, shared enums, profiles, roles helpers.

create extension if not exists pg_trgm with schema extensions;

create type public.user_role as enum ('viewer', 'admin');
create type public.access_level as enum ('free', 'subscriber');
create type public.publish_status as enum ('draft', 'published', 'archived');
create type public.app_locale as enum ('ar', 'fr', 'en');

-- Keeps updated_at current on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- True when a jsonb value is an i18n object with at least one non-empty ar/fr/en entry
-- and no other keys.
create function public.is_i18n_text(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(value) = 'object'
    and not exists (
      select 1 from jsonb_object_keys(value) k where k not in ('ar', 'fr', 'en')
    )
    and exists (
      select 1 from jsonb_each_text(value) e where length(trim(e.value)) > 0
    ),
    false
  );
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  locale public.app_locale not null default 'ar',
  role public.user_role not null default 'viewer',
  country text check (country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row when a user signs up. Role is always 'viewer'; admins are promoted in SQL.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 80),
    case when v_locale in ('ar', 'fr', 'en') then v_locale::public.app_locale else 'ar' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Users may only change these columns; role/country are server-managed.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, locale) on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
