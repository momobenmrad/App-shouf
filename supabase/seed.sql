-- Demo data for local development (supabase db reset).

insert into public.plans (code, name, price_millimes, interval, max_streams, sort_order) values
  ('monthly', '{"ar":"شهري","fr":"Mensuel","en":"Monthly"}', 12000, 'month', 2, 1),
  ('yearly', '{"ar":"سنوي","fr":"Annuel","en":"Yearly"}', 120000, 'year', 2, 2)
on conflict (code) do nothing;

insert into public.genres (slug, name) values
  ('drama', '{"ar":"دراما","fr":"Drame","en":"Drama"}'),
  ('comedy', '{"ar":"كوميديا","fr":"Comédie","en":"Comedy"}'),
  ('documentary', '{"ar":"وثائقي","fr":"Documentaire","en":"Documentary"}'),
  ('kids', '{"ar":"أطفال","fr":"Enfants","en":"Kids"}')
on conflict (slug) do nothing;

insert into public.titles (kind, slug, name, synopsis, release_year, access, status, featured) values
  ('movie', 'demo-film', '{"ar":"فيلم تجريبي","fr":"Film de démonstration","en":"Demo film"}',
   '{"ar":"فيلم لاختبار المنصة.","fr":"Un film pour tester la plateforme.","en":"A film to test the platform."}',
   2026, 'free', 'published', true),
  ('series', 'demo-serie', '{"ar":"مسلسل تجريبي","fr":"Série de démonstration","en":"Demo series"}',
   '{"fr":"Une série pour tester les saisons et épisodes."}', 2026, 'subscriber', 'published', false)
on conflict (slug) do nothing;

insert into public.seasons (title_id, number)
select id, 1 from public.titles where slug = 'demo-serie'
on conflict do nothing;

insert into public.episodes (season_id, number, name, status)
select s.id, n, jsonb_build_object('fr', 'Épisode ' || n, 'ar', 'الحلقة ' || n, 'en', 'Episode ' || n), 'published'
from public.seasons s join public.titles t on t.id = s.title_id, generate_series(1, 3) n
where t.slug = 'demo-serie'
on conflict do nothing;
