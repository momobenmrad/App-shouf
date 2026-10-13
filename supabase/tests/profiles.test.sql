-- Phase 3: viewer profiles.
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

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000b', 'viewer@chouf.test', '{"display_name":"Samir"}'),
  ('00000000-0000-0000-0000-00000000000c', 'other@chouf.test', '{}');
insert into public.media_assets (id, original_filename, content_type, size_bytes, source_key, status)
  values ('20000000-0000-0000-0000-000000000001', 'a.mp4', 'video/mp4', 10, 'sources/a.mp4', 'ready');
update public.titles set asset_id = '20000000-0000-0000-0000-000000000001' where slug = 'demo-film';

select tests.ok((select count(*) = 1 and bool_and(is_default) and max(name) = 'Samir' from public.viewer_profiles where user_id = '00000000-0000-0000-0000-00000000000b'),
  'signup creates one default profile named after the account');

set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');

insert into public.viewer_profiles (user_id, name, is_kids, maturity_max) values (auth.uid(), '  Yasmine ', true, '18+');
select tests.ok((select name = 'Yasmine' and maturity_max = '12+' from public.viewer_profiles where is_kids), 'kids profiles are trimmed and capped at 12+');

insert into public.viewer_profiles (user_id, name) select auth.uid(), 'P' || i from generate_series(3, 5) i;
do $$
begin
  insert into public.viewer_profiles (user_id, name) values (auth.uid(), 'P6');
  raise exception 'FAILED: sixth profile accepted';
exception when sqlstate 'CH003' then raise notice 'ok - at most 5 profiles per account';
end;
$$;

do $$
begin
  insert into public.viewer_profiles (user_id, name) values ('00000000-0000-0000-0000-00000000000c', 'intrus');
  raise exception 'FAILED: profile created for another user';
exception when insufficient_privilege then raise notice 'ok - cannot create a profile for another account';
end;
$$;
select tests.ok((select count(*) = 5 from public.viewer_profiles), 'viewer sees only own profiles');

-- Progress is per profile and the profile must belong to the user.
insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
  select auth.uid(), v.id, '20000000-0000-0000-0000-000000000001', t.id, 300
  from public.viewer_profiles v, public.titles t where v.is_kids and t.slug = 'demo-film';
insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
  select auth.uid(), v.id, '20000000-0000-0000-0000-000000000001', t.id, 900
  from public.viewer_profiles v, public.titles t where v.is_default and t.slug = 'demo-film';
select tests.ok((select count(*) = 2 from public.playback_progress), 'two profiles keep separate progress on the same title');
reset role;

select set_config('tests.kids_profile', (select id::text from public.viewer_profiles where name = 'Yasmine'), true);

set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000c');
do $$
begin
  insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
    select auth.uid(), current_setting('tests.kids_profile')::uuid, '20000000-0000-0000-0000-000000000001', t.id, 1
    from public.titles t where t.slug = 'demo-film';
  raise exception 'FAILED: progress written on a foreign profile';
exception when insufficient_privilege or sqlstate 'CH004' then raise notice 'ok - progress cannot target another account''s profile';
end;
$$;
reset role;

select tests.ok(public.maturity_rank('16+') > public.maturity_rank('12+') and public.maturity_rank('all') = 0, 'maturity ranks are ordered');

rollback;
