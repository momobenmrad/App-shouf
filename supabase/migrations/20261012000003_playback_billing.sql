-- Chouf — playback progress, concurrent sessions, plans, subscriptions, payments.

create type public.billing_interval as enum ('month', 'year');
create type public.subscription_status as enum ('pending', 'active', 'expired', 'canceled');
create type public.payment_status as enum ('pending', 'succeeded', 'failed');

create table public.playback_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  episode_id uuid references public.episodes (id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0),
  duration_seconds integer check (duration_seconds >= 0),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, asset_id)
);

create index playback_progress_recent_idx on public.playback_progress (user_id, updated_at desc);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name jsonb not null check (public.is_i18n_text(name)),
  price_millimes integer not null check (price_millimes > 0),
  currency text not null default 'TND' check (currency ~ '^[A-Z]{3}$'),
  interval public.billing_interval not null,
  max_streams smallint not null default 2 check (max_streams between 1 and 10),
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

-- One subscription row per user; each successful payment extends current_period_end.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status public.subscription_status not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  provider text not null,
  provider_ref text,
  amount_millimes integer not null check (amount_millimes > 0),
  currency text not null,
  status public.payment_status not null default 'pending',
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);

create index payments_user_idx on public.payments (user_id, created_at desc);

create table public.playback_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_id uuid references public.media_assets (id) on delete cascade,
  channel_id uuid,
  device_id text not null check (char_length(device_id) between 8 and 64),
  country text,
  started_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint playback_sessions_target check ((asset_id is null) <> (channel_id is null))
);

create index playback_sessions_live_idx on public.playback_sessions (user_id, last_heartbeat_at)
  where ended_at is null;

-- Helpers -------------------------------------------------------------------------------------

create function public.active_subscription(p_user_id uuid)
returns public.subscriptions
language sql
stable
security definer
set search_path = ''
as $$
  select s.* from public.subscriptions s
  where s.user_id = p_user_id and s.status = 'active' and s.current_period_end > now()
  limit 1;
$$;

-- Marks a payment as succeeded and extends the user's subscription. Idempotent: calling it twice
-- for the same payment extends the period once.
create function public.apply_successful_payment(p_payment_id uuid, p_raw jsonb default null)
returns public.subscriptions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payment public.payments;
  v_plan public.plans;
  v_sub public.subscriptions;
  v_interval interval;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment % not found', p_payment_id using errcode = 'P0002';
  end if;

  if v_payment.status = 'succeeded' then
    select * into v_sub from public.subscriptions where id = v_payment.subscription_id;
    return v_sub;
  end if;

  select * into v_plan from public.plans where id = v_payment.plan_id;
  v_interval := case v_plan.interval when 'month' then interval '1 month' else interval '1 year' end;

  insert into public.subscriptions as s
    (user_id, plan_id, status, current_period_start, current_period_end, provider)
  values (v_payment.user_id, v_plan.id, 'active', now(), now() + v_interval, v_payment.provider)
  on conflict (user_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    current_period_start = case
      when s.status = 'active' and s.current_period_end > now() then s.current_period_start
      else now()
    end,
    current_period_end = case
      when s.status = 'active' and s.current_period_end > now() then s.current_period_end
      else now()
    end + v_interval,
    provider = excluded.provider
  returning * into v_sub;

  update public.payments
    set status = 'succeeded', subscription_id = v_sub.id, paid_at = now(), raw = coalesce(p_raw, raw)
    where id = p_payment_id;

  return v_sub;
end;
$$;

create function public.expire_subscriptions()
returns integer
language sql
security definer
set search_path = ''
as $$
  with expired as (
    update public.subscriptions set status = 'expired'
    where status = 'active' and current_period_end <= now()
    returning 1
  )
  select count(*)::integer from expired;
$$;

-- Opens (or reuses, for the same device) a playback session while enforcing the concurrent stream
-- limit. Raises 'too_many_streams' (errcode CH001) when the limit is reached.
create function public.open_playback_session(
  p_user_id uuid,
  p_asset_id uuid,
  p_channel_id uuid,
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
  -- Serialise concurrent requests of the same user.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.playback_sessions set ended_at = now()
    where user_id = p_user_id and ended_at is null
      and (last_heartbeat_at < now() - p_stale_after or device_id = p_device_id);

  select count(*) into v_live from public.playback_sessions
    where user_id = p_user_id and ended_at is null;

  if v_live >= p_max_streams then
    raise exception 'too_many_streams' using errcode = 'CH001';
  end if;

  insert into public.playback_sessions (user_id, asset_id, channel_id, device_id, country)
  values (p_user_id, p_asset_id, p_channel_id, p_device_id, p_country)
  returning * into v_session;

  return v_session;
end;
$$;

revoke execute on function public.apply_successful_payment(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.expire_subscriptions() from public, anon, authenticated;
revoke execute on function public.open_playback_session(uuid, uuid, uuid, text, text, integer, interval)
  from public, anon, authenticated;
revoke execute on function public.active_subscription(uuid) from public, anon, authenticated;

-- RLS ------------------------------------------------------------------------------------------

alter table public.playback_progress enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.playback_sessions enable row level security;

create policy "playback_progress: own rows" on public.playback_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "plans: read active" on public.plans for select using (active or public.is_admin());
create policy "plans: admin" on public.plans
  for all using (public.is_admin()) with check (public.is_admin());

-- Subscriptions, payments and sessions are written only by the server (service_role bypasses RLS).
create policy "subscriptions: read own" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());
create policy "payments: read own" on public.payments
  for select using (user_id = auth.uid() or public.is_admin());
create policy "playback_sessions: read own" on public.playback_sessions
  for select using (user_id = auth.uid() or public.is_admin());
