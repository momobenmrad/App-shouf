-- Phase 3: recommendations.
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

-- Three accounts, each with its default profile.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000b', 'b@chouf.test'),
  ('00000000-0000-0000-0000-00000000000c', 'c@chouf.test'),
  ('00000000-0000-0000-0000-00000000000d', 'd@chouf.test');

-- Assets and titles: two dramas, one comedy, one 18+ drama, one draft.
insert into public.media_assets (id, original_filename, content_type, size_bytes, source_key, status)
select ('2000000' || i || '-0000-0000-0000-000000000001')::uuid, 'a' || i, 'video/mp4', 10, 'sources/a' || i, 'ready' from generate_series(1, 5) i;

insert into public.titles (id, kind, slug, name, access, status, maturity_rating, asset_id) values
  ('10000000-0000-0000-0000-000000000001', 'movie', 'drama-1', '{"fr":"Drame 1"}', 'free', 'published', 'all', '20000001-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'movie', 'drama-2', '{"fr":"Drame 2"}', 'free', 'published', '12+', '20000002-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000003', 'movie', 'comedy-1', '{"fr":"Comédie 1"}', 'free', 'published', 'all', '20000003-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000004', 'movie', 'drama-adult', '{"fr":"Drame 18+"}', 'free', 'published', '18+', '20000004-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000005', 'movie', 'drama-draft', '{"fr":"Brouillon"}', 'free', 'draft', 'all', '20000005-0000-0000-0000-000000000001');

insert into public.title_genres (title_id, genre_id)
select t.id, g.id from public.titles t join public.genres g on g.slug = case when t.slug like 'drama%' then 'drama' else 'comedy' end
where t.slug in ('drama-1', 'drama-2', 'comedy-1', 'drama-adult', 'drama-draft');

-- History: B watched drama-1; C watched drama-1 and drama-2; D watched drama-1, drama-2 and the 18+ one.
insert into public.playback_progress (user_id, profile_id, asset_id, title_id, position_seconds)
select v.user_id, v.id, t.asset_id, t.id, 60
from public.viewer_profiles v
join public.titles t on
  (v.user_id = '00000000-0000-0000-0000-00000000000b' and t.slug in ('drama-1'))
  or (v.user_id = '00000000-0000-0000-0000-00000000000c' and t.slug in ('drama-1', 'drama-2'))
  or (v.user_id = '00000000-0000-0000-0000-00000000000d' and t.slug in ('drama-1', 'drama-2', 'drama-adult'));

select set_config('tests.profile_b', (select id::text from public.viewer_profiles where user_id = '00000000-0000-0000-0000-00000000000b'), true);
select set_config('tests.profile_c', (select id::text from public.viewer_profiles where user_id = '00000000-0000-0000-0000-00000000000c'), true);

set local role anon;
select tests.ok(
  (select array_agg(slug order by ord) = array['drama-1', 'drama-2', 'drama-adult']
   from (select slug, row_number() over () ord from public.trending_titles(array['all', '10+', '12+', '16+', '18+'])) x),
  'trending ranks titles by distinct viewers');
select tests.ok(
  (select bool_and(maturity_rating in ('all', '10+', '12+')) and count(*) = 2 from public.trending_titles(array['all', '10+', '12+'])),
  'trending respects the rating cap');
reset role;

set local role authenticated;
select tests.login('00000000-0000-0000-0000-00000000000b');
select tests.ok(
  (select array_agg(slug order by ord) = array['drama-2', 'drama-adult']
   from (select slug, row_number() over () ord from public.recommended_titles_for_me(current_setting('tests.profile_b')::uuid, array['all', '10+', '12+', '16+', '18+'])) x),
  'recommendations follow watched genres, skip watched titles, drafts and other genres');
select tests.ok(
  (select array_agg(slug) = array['drama-2'] from public.recommended_titles_for_me(current_setting('tests.profile_b')::uuid, array['all', '12+'])),
  'recommendations respect the rating cap');
select tests.ok(
  (select (array_agg(slug order by ord))[1] = 'drama-2'
   from (select slug, row_number() over () ord from public.similar_titles_for_me('10000000-0000-0000-0000-000000000001', current_setting('tests.profile_b')::uuid, array['all', '10+', '12+', '16+', '18+'])) x),
  'co-watched titles come first in "because you watched"');
select tests.ok(
  (select count(*) = 0 from public.recommended_titles_for_me(current_setting('tests.profile_c')::uuid, array['all', '18+'])),
  'a user cannot query recommendations for another account''s profile');
do $$
begin
  perform public.recommended_titles(current_setting('tests.profile_c')::uuid, array['all'], 5);
  raise exception 'FAILED: raw recommendation function callable by viewers';
exception when insufficient_privilege then raise notice 'ok - raw recommendation functions are not exposed';
end;
$$;
reset role;

rollback;
