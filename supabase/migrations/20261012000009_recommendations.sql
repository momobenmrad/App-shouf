-- Chouf — Phase 3: recommendations computed in SQL from viewing history.
-- Signals: which profiles watched which titles (playback_progress) and title genres.
-- The functions are SECURITY DEFINER so they can read other profiles' history in aggregate, but
-- they only ever return published titles filtered by the caller's rating cap, never who watched.

-- Titles most watched by distinct profiles over the last p_days days.
create function public.trending_titles(p_ratings text[], p_days integer default 7, p_limit integer default 18)
returns setof public.titles
language sql
stable
security definer
set search_path = ''
as $$
  select t.*
  from public.titles t
  join (
    select title_id, count(distinct profile_id) as viewers, max(updated_at) as last_seen
    from public.playback_progress
    where updated_at > now() - make_interval(days => greatest(p_days, 1))
    group by title_id
  ) v on v.title_id = t.id
  where t.status = 'published' and t.maturity_rating = any (p_ratings)
  order by v.viewers desc, v.last_seen desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Unwatched titles sharing genres with what the profile watched, weighted by how often each genre
-- appears in its history; ties broken by popularity and recency.
create function public.recommended_titles(p_profile_id uuid, p_ratings text[], p_limit integer default 18)
returns setof public.titles
language sql
stable
security definer
set search_path = ''
as $$
  with watched as (
    select title_id from public.playback_progress where profile_id = p_profile_id
  ),
  genre_weight as (
    select tg.genre_id, count(*)::numeric as w
    from watched w join public.title_genres tg on tg.title_id = w.title_id
    group by tg.genre_id
  ),
  popularity as (
    select title_id, count(distinct profile_id) as viewers
    from public.playback_progress
    where updated_at > now() - interval '30 days'
    group by title_id
  )
  select t.*
  from public.titles t
  join public.title_genres tg on tg.title_id = t.id
  join genre_weight gw on gw.genre_id = tg.genre_id
  left join popularity p on p.title_id = t.id
  where t.status = 'published'
    and t.maturity_rating = any (p_ratings)
    and t.id not in (select title_id from watched)
  group by t.id, p.viewers
  order by sum(gw.w) desc, coalesce(p.viewers, 0) desc, t.published_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- "Because you watched X": titles co-watched by other profiles that watched X, then same-genre
-- titles, excluding what the profile already watched.
create function public.similar_titles(p_title_id uuid, p_profile_id uuid, p_ratings text[], p_limit integer default 18)
returns setof public.titles
language sql
stable
security definer
set search_path = ''
as $$
  with watched as (
    select title_id from public.playback_progress where profile_id = p_profile_id
  ),
  cowatch as (
    select pp.title_id, count(distinct pp.profile_id) as score
    from public.playback_progress seed
    join public.playback_progress pp on pp.profile_id = seed.profile_id and pp.title_id <> seed.title_id
    where seed.title_id = p_title_id
    group by pp.title_id
  ),
  same_genre as (
    select tg2.title_id, count(*) as score
    from public.title_genres tg1
    join public.title_genres tg2 on tg2.genre_id = tg1.genre_id and tg2.title_id <> tg1.title_id
    where tg1.title_id = p_title_id
    group by tg2.title_id
  ),
  scored as (
    select coalesce(c.title_id, g.title_id) as title_id,
           coalesce(c.score, 0) * 10 + coalesce(g.score, 0) as score
    from cowatch c full join same_genre g on g.title_id = c.title_id
  )
  select t.*
  from scored s join public.titles t on t.id = s.title_id
  where t.status = 'published'
    and t.maturity_rating = any (p_ratings)
    and t.id <> p_title_id
    and t.id not in (select title_id from watched)
  order by s.score desc, t.published_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Callers may only ask for their own profile.
create function public.owns_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.viewer_profiles where id = p_profile_id and user_id = auth.uid());
$$;

create function public.recommended_titles_for_me(p_profile_id uuid, p_ratings text[], p_limit integer default 18)
returns setof public.titles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.recommended_titles(p_profile_id, p_ratings, p_limit) where public.owns_profile(p_profile_id);
$$;

create function public.similar_titles_for_me(p_title_id uuid, p_profile_id uuid, p_ratings text[], p_limit integer default 18)
returns setof public.titles
language sql
stable
security definer
set search_path = ''
as $$
  select * from public.similar_titles(p_title_id, p_profile_id, p_ratings, p_limit) where public.owns_profile(p_profile_id);
$$;

revoke execute on function public.recommended_titles(uuid, text[], integer) from public, anon, authenticated;
revoke execute on function public.similar_titles(uuid, uuid, text[], integer) from public, anon, authenticated;
grant execute on function public.trending_titles(text[], integer, integer) to anon, authenticated;
grant execute on function public.recommended_titles_for_me(uuid, text[], integer) to authenticated;
grant execute on function public.similar_titles_for_me(uuid, uuid, text[], integer) to authenticated;
