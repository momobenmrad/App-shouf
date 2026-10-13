-- RLS and business-rule tests. Runs in one transaction that is rolled back.
begin;

create schema tests;
create function tests.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAILED: %', label; end if;
  raise notice 'ok - %', label;
end;
$$;
create function tests.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claim.sub', uid::text, true);
$$;
grant usage on schema tests to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Fixtures (as superuser) -------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@chouf.test', '{"locale":"fr"}'),
  ('00000000-0000-0000-0000-00000000000b', 'viewer@chouf.test', '{"display_name":"Viewer","locale":"xx"}'),
  ('00000000-0000-0000-0000-00000000000c', 'other@chouf.test', '{}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';

select tests.ok(
  (select locale = 'ar' and role = 'viewer' from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'signup trigger creates a viewer profile and rejects unknown locales');

insert into public.titles (id, kind, slug, name, status) values
  ('10000000-0000-0000-0000-000000000001', 'movie', 'draft-movie', '{"fr":"Brouillon"}', 'draft');
insert into public.media_assets (id, original_filename, content_type, size_bytes, source_key, status, duration_seconds)
  values ('20000000-0000-0000-0000-000000000001', 'a.mp4', 'video/mp4', 10, 'sources/a.mp4', 'ready', 3600);
update public.titles set asset_id = '20000000-0000-0000-0000-000000000001' where slug = 'demo-film';

select tests.ok(
  (select duration_seconds = 3600 from public.titles where slug = 'demo-film'),
  'duration is copied from the asset when linked');
update public.media_assets set duration_seconds = 3700 where id = '20000000-0000-0000-0000-000000000001';
select tests.ok(
  (select duration_seconds = 3700 from public.titles where slug = 'demo-film'),
  'duration follows asset updates');

insert into public.channels (id, slug, name, category, country, language, status) values
  ('30000000-0000-0000-0000-000000000001', 'watania', '{"ar":"الوطنية"}', 'general', 'TN', 'ar', 'active');
insert into public.channel_sources (channel_id, label, kind, url, priority, license_info) values
  ('30000000-0000-0000-0000-000000000001', 'Principale', 'external_hls', 'https://origin.example/live.m3u8', 1,
   '{"holder":"TT","agreement_ref":"TT-1","expires_at":"2027-01-01","territories":["TN"]}');

-- license_info is mandatory and validated -------------------------------------------------------
do $$
begin
  begin
    insert into public.channel_sources (channel_id, label, kind, url, priority, license_info) values
      ('30000000-0000-0000-0000-000000000001', 'Sans licence', 'external_hls', 'https://x.example/a.m3u8', 2,
       '{"holder":"TT","agreement_ref":"TT-1","expires_at":"2027-01-01","territories":["tn"]}');
    raise exception 'FAILED: invalid territory accepted';
  exception when check_violation then raise notice 'ok - license_info rejects malformed territories';
  end;
  begin
    insert into public.channel_sources (channel_id, label, kind, url, priority, license_info) values
      ('30000000-0000-0000-0000-000000000001', 'Sans licence', 'external_hls', 'https://x.example/a.m3u8', 2, '{}');
    raise exception 'FAILED: empty license accepted';
  exception when check_violation then raise notice 'ok - license_info is mandatory';
  end;
end;
$$;

-- Anonymous visitor -----------------------------------------------------------------------------
set local role anon;
select tests.login(null);
select tests.ok((select count(*) = 2 from public.titles), 'anon sees only published titles');
select tests.ok((select count(*) = 0 from public.media_assets), 'anon cannot read media assets');
select tests.ok((select count(*) = 2 from public.plans), 'anon can read active plans');
select tests.ok((select count(*) = 1 from public.channels), 'anon can read active channels');
do $$
begin
  perform 1 from public.channel_sources;
  raise exception 'FAILED: anon read channel_sources';
exception when insufficient_privilege then raise notice 'ok - anon has no privilege on channel_sources';
end;
$$;
reset role;

-- Viewer ----------------------------------------------------------------------------------------
set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');

select tests.ok((select count(*) = 0 from public.titles where status = 'draft'), 'viewer cannot see drafts');
select tests.ok((select count(*) = 0 from public.channel_sources), 'viewer cannot read source URLs');
select tests.ok((select count(*) = 1 from public.profiles), 'viewer only sees own profile');
select tests.ok((select count(*) = 3 from public.episodes), 'viewer sees published episodes');
select tests.ok(not public.is_admin(), 'viewer is not admin');

do $$
begin
  update public.profiles set role = 'admin' where id = auth.uid();
  raise exception 'FAILED: viewer escalated to admin';
exception when insufficient_privilege then raise notice 'ok - viewer cannot change own role';
end;
$$;

update public.profiles set display_name = 'Nouveau nom' where id = auth.uid();
select tests.ok((select display_name = 'Nouveau nom' from public.profiles), 'viewer can rename self');

update public.titles set status = 'archived' where slug = 'demo-film';
select tests.ok((select count(*) = 2 from public.titles where status = 'published'), 'viewer cannot modify titles');

insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
  select auth.uid(), (select id from public.viewer_profiles where user_id = auth.uid() and is_default), '20000000-0000-0000-0000-000000000001', id, 120
  from public.titles where slug = 'demo-film';
select tests.ok((select position_seconds = 120 from public.playback_progress), 'viewer writes own progress');

do $$
begin
  insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
    select '00000000-0000-0000-0000-00000000000c', (select id from public.viewer_profiles where user_id = auth.uid() and is_default), '20000000-0000-0000-0000-000000000001', id, 5
    from public.titles where slug = 'demo-film';
  raise exception 'FAILED: viewer wrote progress for someone else';
exception when insufficient_privilege or sqlstate 'CH004' then raise notice 'ok - viewer cannot write progress of another user';
end;
$$;

do $$
begin
  insert into public.subscriptions (user_id, plan_id, status, provider, current_period_end)
    select auth.uid(), id, 'active', 'manual', now() + interval '1 year' from public.plans limit 1;
  raise exception 'FAILED: viewer granted self a subscription';
exception when insufficient_privilege then raise notice 'ok - viewer cannot create a subscription';
end;
$$;

do $$
begin
  perform public.apply_successful_payment(gen_random_uuid());
  raise exception 'FAILED: viewer executed apply_successful_payment';
exception when insufficient_privilege then raise notice 'ok - viewer cannot call billing functions';
end;
$$;

select tests.ok(
  (select count(*) = 2 from public.search_titles('demonstraton')),
  'search tolerates typos');
select tests.ok(
  (select count(*) = 1 from public.search_titles('تجريبي') where slug = 'demo-film'),
  'search works in Arabic');
reset role;

-- Admin -----------------------------------------------------------------------------------------
set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000a');
select tests.ok(public.is_admin(), 'admin is admin');
select tests.ok((select count(*) = 3 from public.titles), 'admin sees drafts');
select tests.ok((select count(*) = 1 from public.channel_sources), 'admin reads channel sources');
select tests.ok((select count(*) = 3 from public.profiles), 'admin reads all profiles');
update public.titles set status = 'published' where slug = 'draft-movie';
select tests.ok(
  (select published_at is not null from public.titles where slug = 'draft-movie'),
  'publishing stamps published_at');
reset role;

-- Billing (server / service role) -------------------------------------------------------------
set local role service_role;
insert into public.payments (id, user_id, plan_id, provider, provider_ref, amount_millimes, currency)
  select '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', id, 'konnect', 'ref-1',
         price_millimes, currency
  from public.plans where code = 'monthly';
select public.apply_successful_payment('40000000-0000-0000-0000-000000000001');
select public.apply_successful_payment('40000000-0000-0000-0000-000000000001');
select tests.ok(
  (select status = 'active'
      and current_period_end between now() + interval '1 month' - interval '1 minute'
                                 and now() + interval '1 month' + interval '1 minute'
   from public.subscriptions where user_id = '00000000-0000-0000-0000-00000000000b'),
  'payment applied once even when the webhook is replayed');

insert into public.payments (id, user_id, plan_id, provider, provider_ref, amount_millimes, currency)
  select '40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', id, 'konnect', 'ref-2',
         price_millimes, currency
  from public.plans where code = 'monthly';
select public.apply_successful_payment('40000000-0000-0000-0000-000000000002');
select tests.ok(
  (select current_period_end > now() + interval '1 month' + interval '27 days'
   from public.subscriptions where user_id = '00000000-0000-0000-0000-00000000000b'),
  'renewal before expiry stacks on the current period');

select tests.ok(
  (select (public.active_subscription('00000000-0000-0000-0000-00000000000b')).id is not null),
  'active_subscription finds the subscription');

-- Concurrent streams
select public.open_playback_session('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', null, null, 'device-aaaa', 'TN', 2);
select public.open_playback_session('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', null, null, 'device-bbbb', 'TN', 2);
select public.open_playback_session('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', null, null, 'device-aaaa', 'TN', 2);
select tests.ok(
  (select count(*) = 2 from public.playback_sessions where user_id = '00000000-0000-0000-0000-00000000000b' and ended_at is null),
  'same device reuses its slot');
do $$
begin
  perform public.open_playback_session('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', null, null, 'device-cccc', 'TN', 2);
  raise exception 'FAILED: third stream allowed';
exception when sqlstate 'CH001' then raise notice 'ok - third concurrent stream is refused';
end;
$$;
update public.playback_sessions set last_heartbeat_at = now() - interval '5 minutes'
  where device_id = 'device-bbbb';
select public.open_playback_session('00000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-000000000001', null, null, 'device-cccc', 'TN', 2);
select tests.ok(true, 'stale sessions free their slot');

update public.subscriptions set current_period_end = now() - interval '1 second';
select tests.ok(public.expire_subscriptions() = 1, 'expired subscriptions are closed');
reset role;

rollback;
