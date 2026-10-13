-- Demo content (superuser). Users: viewer (samir@demo.tn / demo1234) and admin (admin@demo.tn / demo1234).
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'samir@demo.tn', '{"display_name":"Samir","locale":"fr"}'),
  ('22222222-2222-4222-8222-222222222222', 'admin@demo.tn', '{"display_name":"Admin Chouf","locale":"fr"}'),
  ('33333333-3333-4333-8333-333333333333', 'leila@demo.tn', '{"display_name":"Leila","locale":"ar"}');
update public.profiles set role = 'admin' where id = '22222222-2222-4222-8222-222222222222';
insert into public.viewer_profiles (user_id, name, avatar, color, is_kids) values ('11111111-1111-4111-8111-111111111111', 'Yasmine', '🦄', 300, true);

insert into public.media_assets (id, original_filename, content_type, size_bytes, source_key, status, hls_prefix, duration_seconds, width, height, progress, protection, renditions) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'film-1.mp4', 'video/mp4', 6570992, 'sources/a1/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'film-2.mp4', 'video/mp4', 6570992, 'sources/a2/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'film-3.mp4', 'video/mp4', 6570992, 'sources/a3/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 'film-4.mp4', 'video/mp4', 6570992, 'sources/a4/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 'film-5.mp4', 'video/mp4', 6570992, 'sources/a5/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 'film-6.mp4', 'video/mp4', 6570992, 'sources/a6/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 'film-7.mp4', 'video/mp4', 6570992, 'sources/a7/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 'film-8.mp4', 'video/mp4', 6570992, 'sources/a8/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 'film-9.mp4', 'video/mp4', 6570992, 'sources/a9/film.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', 40, 1280, 720, 100, 'none', '[]'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'sidi-bou.mp4', 'video/mp4', 6570992, 'sources/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/sidi-bou.mp4', 'ready', 'hls/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 40, 1280, 720, 100, 'none',
   '[{"name":"240p","width":426,"height":240,"videoBitrateKbps":400,"audioBitrateKbps":64},{"name":"360p","width":640,"height":360,"videoBitrateKbps":800,"audioBitrateKbps":96},{"name":"480p","width":854,"height":480,"videoBitrateKbps":1400,"audioBitrateKbps":128},{"name":"720p","width":1280,"height":720,"videoBitrateKbps":2800,"audioBitrateKbps":128}]'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'el-medina-s01e01.mp4', 'video/mp4', 900000000, 'sources/b/e1.mp4', 'processing', null, null, 1920, 1080, 62, 'aes128', '[]'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'carthage-master.mov', 'video/quicktime', 24000000000, 'sources/c/c.mov', 'queued', null, null, null, null, 0, 'aes128', '[]'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'archive-1998.avi', 'video/x-msvideo', 700000000, 'sources/d/d.avi', 'failed', null, null, null, null, 0, 'none', '[]');
update public.media_assets set error = 'no video stream found' where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

delete from public.titles where slug in ('demo-film', 'demo-serie');
insert into public.titles (id, kind, slug, name, synopsis, release_year, maturity_rating, poster_path, backdrop_path, access, status, featured, asset_id, published_at) values
  ('a0000000-0000-4000-8000-000000000001', 'movie', 'sidi-bou', '{"ar":"سيدي بو","fr":"Sidi Bou","en":"Sidi Bou"}', '{"ar":"في قرية سيدي بوسعيد، يعود رسّام إلى بيت طفولته ويكتشف سرًا عائليًا قديمًا.","fr":"À Sidi Bou Saïd, un peintre revient dans la maison de son enfance et découvre un secret de famille enfoui depuis trente ans.","en":"In Sidi Bou Said, a painter returns to his childhood home and uncovers a family secret buried for thirty years."}', 2025, '12+', 'artwork/sidi-bou-poster.jpg', 'artwork/sidi-bou-backdrop.jpg', 'free', 'published', true, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', now() - interval '2 days'),
  ('a0000000-0000-4000-8000-000000000002', 'series', 'el-medina', '{"ar":"المدينة","fr":"El Medina","en":"El Medina"}', '{"ar":"ثلاث عائلات، شارع واحد، وصيف يغيّر كل شيء.","fr":"Trois familles, une ruelle de la médina de Tunis, et un été qui change tout.","en":"Three families, one alley in the Tunis medina, and a summer that changes everything."}', 2026, '12+', 'artwork/el-medina-poster.jpg', 'artwork/el-medina-backdrop.jpg', 'subscriber', 'published', false, null, now() - interval '5 days'),
  ('a0000000-0000-4000-8000-000000000003', 'movie', 'sahara-nights', '{"ar":"ليالي الصحراء","fr":"Sahara Nights","en":"Sahara Nights"}', '{"fr":"Un road-movie musical de Douz à Tozeur.","en":"A musical road movie from Douz to Tozeur."}', 2024, 'all', 'artwork/sahara-nights-poster.jpg', 'artwork/sahara-nights-backdrop.jpg', 'subscriber', 'published', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', now() - interval '9 days'),
  ('a0000000-0000-4000-8000-000000000004', 'movie', 'djerba-blues', '{"ar":"بلوز جربة","fr":"Djerba Blues","en":"Djerba Blues"}', '{"fr":"Comédie douce-amère sur une famille d’hôteliers à Djerba."}', 2023, 'all', 'artwork/djerba-blues-poster.jpg', 'artwork/djerba-blues-backdrop.jpg', 'subscriber', 'published', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4', now() - interval '12 days'),
  ('a0000000-0000-4000-8000-000000000005', 'movie', 'carthage', '{"ar":"قرطاج","fr":"Carthage","en":"Carthage"}', '{"fr":"Fresque historique : la chute de Carthage vue par une jeune prêtresse."}', 2026, '16+', 'artwork/carthage-poster.jpg', 'artwork/carthage-backdrop.jpg', 'subscriber', 'draft', false, null, null),
  ('a0000000-0000-4000-8000-000000000006', 'movie', 'le-souk', '{"ar":"السوق","fr":"Le Souk","en":"The Souk"}', '{"fr":"Documentaire sur les artisans du souk de Tunis."}', 2022, 'all', 'artwork/le-souk-poster.jpg', 'artwork/le-souk-backdrop.jpg', 'free', 'published', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6', now() - interval '20 days'),
  ('a0000000-0000-4000-8000-000000000007', 'series', 'bab-bhar', '{"ar":"باب بحر","fr":"Bab Bhar","en":"Bab Bhar"}', '{"fr":"Thriller policier dans le Tunis des années 80."}', 2025, '16+', 'artwork/bab-bhar-poster.jpg', 'artwork/bab-bhar-backdrop.jpg', 'subscriber', 'published', false, null, now() - interval '30 days'),
  ('a0000000-0000-4000-8000-000000000008', 'series', 'ramadan-stories', '{"ar":"حكايات رمضان","fr":"Ramadan Stories","en":"Ramadan Stories"}', '{"fr":"Mini-série de contes pour toute la famille."}', 2026, 'all', 'artwork/ramadan-stories-poster.jpg', 'artwork/ramadan-stories-backdrop.jpg', 'free', 'published', false, null, now() - interval '1 day'),
  ('a0000000-0000-4000-8000-000000000009', 'movie', 'kids-club', '{"ar":"نادي الأطفال","fr":"Kids Club","en":"Kids Club"}', '{"fr":"Dessin animé : trois amis explorent la médina."}', 2026, 'all', 'artwork/kids-club-poster.jpg', 'artwork/kids-club-backdrop.jpg', 'free', 'published', false, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9', now() - interval '3 days');

insert into public.title_genres (title_id, genre_id)
select t.id, g.id from public.titles t join public.genres g on g.slug = any (case t.slug
  when 'sidi-bou' then array['drama'] when 'el-medina' then array['drama'] when 'sahara-nights' then array['drama','comedy']
  when 'djerba-blues' then array['comedy'] when 'carthage' then array['drama'] when 'le-souk' then array['documentary']
  when 'bab-bhar' then array['drama'] when 'ramadan-stories' then array['kids'] when 'kids-club' then array['kids'] else array[]::text[] end);

insert into public.seasons (id, title_id, number, name) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 1, '{"fr":"Saison 1"}'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 2, '{"fr":"Saison 2"}'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000007', 1, '{}'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000008', 1, '{}');
insert into public.episodes (season_id, number, name, synopsis, status, asset_id)
select s.id, n, jsonb_build_object('fr', 'Épisode ' || n, 'ar', 'الحلقة ' || n, 'en', 'Episode ' || n),
       jsonb_build_object('fr', 'Résumé de l’épisode ' || n || '.'), 'published',
       case when n <= 2 then 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid else null end
from public.seasons s, generate_series(1, 6) n where s.id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000004');
insert into public.episodes (season_id, number, name, status, asset_id)
select 'b0000000-0000-4000-8000-000000000002', n, jsonb_build_object('fr', 'Épisode ' || n), 'published', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' from generate_series(1, 3) n;

-- Subscription for Samir, payments history
insert into public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, provider)
select '11111111-1111-4111-8111-111111111111', id, 'active', now() - interval '12 days', now() + interval '18 days', 'konnect' from public.plans where code = 'monthly';
insert into public.payments (user_id, plan_id, subscription_id, provider, provider_ref, amount_millimes, currency, status, paid_at)
select '11111111-1111-4111-8111-111111111111', p.id, s.id, 'konnect', 'KNT-' || g, 12000, 'TND', 'succeeded', now() - (g || ' months')::interval
from public.plans p join public.subscriptions s on s.plan_id = p.id, generate_series(0, 2) g where p.code = 'monthly';

-- Viewing history (continue watching + recommendations)
insert into public.playback_progress (user_id, profile_id, asset_id, title_id, episode_id, position_seconds, duration_seconds, completed, updated_at)
select v.user_id, v.id, t.asset_id, t.id, null, pos, 40, false, now() - (ago || ' hours')::interval
from public.viewer_profiles v
join (values ('11111111-1111-4111-8111-111111111111'::uuid, 'sidi-bou', 18, 3), ('11111111-1111-4111-8111-111111111111'::uuid, 'le-souk', 25, 30),
             ('33333333-3333-4333-8333-333333333333'::uuid, 'sidi-bou', 30, 5), ('33333333-3333-4333-8333-333333333333'::uuid, 'sahara-nights', 12, 6), ('33333333-3333-4333-8333-333333333333'::uuid, 'djerba-blues', 9, 7),
             ('22222222-2222-4222-8222-222222222222'::uuid, 'sahara-nights', 20, 2), ('22222222-2222-4222-8222-222222222222'::uuid, 'sidi-bou', 35, 50)) h(uid, slug, pos, ago) on h.uid = v.user_id and v.is_default
join public.titles t on t.slug = h.slug;

-- Live channels, sources, health, EPG
insert into public.channels (id, slug, name, logo_path, category, country, language, status, access, sort_order, epg_url, epg_channel_id, epg_updated_at) values
  ('c0000000-0000-4000-8000-000000000001', 'watania', '{"ar":"الوطنية 1","fr":"Watania 1","en":"Watania 1"}', 'artwork/logo-watania.png', 'general', 'TN', 'ar', 'active', 'free', 1, 'https://epg.example.tn/tn.xml', 'watania1.tn', now() - interval '6 hours'),
  ('c0000000-0000-4000-8000-000000000002', 'hannibal', '{"ar":"حنبعل","fr":"Hannibal TV","en":"Hannibal TV"}', 'artwork/logo-hannibal.png', 'entertainment', 'TN', 'ar', 'active', 'subscriber', 2, null, null, null),
  ('c0000000-0000-4000-8000-000000000003', 'nessma', '{"ar":"نسمة","fr":"Nessma","en":"Nessma"}', 'artwork/logo-nessma.png', 'entertainment', 'TN', 'ar', 'active', 'subscriber', 3, null, null, null),
  ('c0000000-0000-4000-8000-000000000004', 'chouf-kids', '{"ar":"شوف أطفال","fr":"Chouf Kids","en":"Chouf Kids"}', 'artwork/logo-kids.png', 'kids', 'TN', 'ar', 'active', 'free', 4, null, null, null),
  ('c0000000-0000-4000-8000-000000000005', 'sport-plus', '{"ar":"سبور+","fr":"Sport+","en":"Sport+"}', 'artwork/logo-sport.png', 'sports', 'TN', 'ar', 'active', 'subscriber', 5, null, null, null),
  ('c0000000-0000-4000-8000-000000000006', 'zitouna', '{"ar":"الزيتونة","fr":"Zitouna","en":"Zitouna"}', 'artwork/logo-quran.png', 'religious', 'TN', 'ar', 'inactive', 'free', 6, null, null, null);
insert into public.channel_sources (id, channel_id, label, kind, url, priority, enabled, license_info, health, consecutive_failures, consecutive_successes, last_checked_at, last_latency_ms, last_bitrate_kbps, last_error) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'Principale', 'external_hls', 'http://localhost:8787/live/watania-principale/index.m3u8', 1, true, '{"holder":"Télévision Tunisienne","agreement_ref":"TT-2026-014","expires_at":"2027-06-30","territories":["TN","DZ","MA","FR"]}', 'healthy', 0, 412, now() - interval '20 seconds', 184, 3120, null),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'Secours', 'external_hls', 'http://localhost:8787/live/watania-secours/index.m3u8', 2, true, '{"holder":"Télévision Tunisienne","agreement_ref":"TT-2026-014","expires_at":"2027-06-30","territories":["TN","DZ","MA","FR"]}', 'healthy', 0, 98, now() - interval '20 seconds', 251, 2980, null),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'Principale', 'external_hls', 'http://localhost:8787/live/hannibal-principale/index.m3u8', 1, true, '{"holder":"Hannibal TV","agreement_ref":"HTV-2026-002","expires_at":"2026-11-15","territories":["TN"]}', 'down', 7, 0, now() - interval '10 seconds', 5002, null, 'timeout'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'Secours', 'external_hls', 'http://localhost:8787/live/hannibal-secours/index.m3u8', 2, true, '{"holder":"Hannibal TV","agreement_ref":"HTV-2026-002","expires_at":"2026-11-15","territories":["TN"]}', 'healthy', 0, 41, now() - interval '10 seconds', 320, 2410, null),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', 'Principale', 'external_hls', 'http://localhost:8787/live/nessma-principale/index.m3u8', 1, true, '{"holder":"Nessma","agreement_ref":"NSM-2025-07","expires_at":"2026-12-31","territories":["TN","DZ","MA"]}', 'degraded', 0, 3, now() - interval '25 seconds', 3412, 2200, 'slow playlist (3412 ms)'),
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000004', 'Principale', 'external_hls', 'http://localhost:8787/live/chouf-kids-principale/index.m3u8', 1, true, '{"holder":"Chouf","agreement_ref":"INTERNE","expires_at":"2030-01-01","territories":["TN","DZ","MA","FR","DE","IT"]}', 'healthy', 0, 900, now() - interval '5 seconds', 92, 1800, null),
  ('d0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000005', 'Principale', 'external_hls', 'http://localhost:8787/live/sport-plus-principale/index.m3u8', 1, true, '{"holder":"Sport Plus SA","agreement_ref":"SP-2026-01","expires_at":"2026-10-25","territories":["TN"]}', 'healthy', 0, 300, now() - interval '15 seconds', 140, 5200, null);
update public.channels c set active_source_id = s.id from public.channel_sources s where s.channel_id = c.id and s.priority = case when c.slug = 'hannibal' then 2 else 1 end;
insert into public.source_health_checks (source_id, checked_at, ok, http_status, latency_ms, bitrate_kbps, error)
select s.id, now() - (g * interval '30 seconds'), case when s.health = 'down' and g < 7 then false when s.health = 'degraded' and g % 3 = 0 then true else true end,
       200, case when s.health = 'degraded' and g % 2 = 0 then 3400 else 150 + (g * 7) % 200 end, 2500, null
from public.channel_sources s, generate_series(0, 39) g;
insert into public.source_incidents (channel_id, source_id, kind, started_at, resolved_at, details) values
  ('c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000003', 'down', now() - interval '3 minutes', null, '{"error":"timeout"}'),
  ('c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000004', 'failover', now() - interval '3 minutes', null, '{"from":"d0000000-0000-4000-8000-000000000003","to":"d0000000-0000-4000-8000-000000000004"}'),
  ('c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000005', 'degraded', now() - interval '12 minutes', null, '{"error":"slow playlist (3412 ms)"}'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'down', now() - interval '2 days', now() - interval '2 days' + interval '9 minutes', '{"error":"HTTP 503"}'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'failover', now() - interval '2 days', now() - interval '2 days' + interval '9 minutes', '{}'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'failback', now() - interval '2 days' + interval '9 minutes', now() - interval '2 days' + interval '9 minutes', '{}');
-- EPG for today: 30-minute to 2-hour programmes around now, on every channel
insert into public.epg_programs (channel_id, start_at, end_at, title, description, category)
select c.id, s, s + d, jsonb_build_object('fr', p.fr, 'ar', p.ar, 'en', p.en), jsonb_build_object('fr', 'Programme de démonstration.'), p.cat
from public.channels c
cross join lateral (
  select date_trunc('hour', now()) - interval '6 hours' + (i * interval '90 minutes') as s, interval '90 minutes' as d, i
  from generate_series(0, 15) i
) x
cross join lateral (
  select * from (values
    ('Journal télévisé', 'الأخبار', 'News', 'news'), ('Le Grand Débat', 'النقاش الكبير', 'The Big Debate', 'talk'),
    ('Série : El Medina', 'مسلسل: المدينة', 'Series: El Medina', 'series'), ('Documentaire', 'وثائقي', 'Documentary', 'documentary'),
    ('Dessins animés', 'رسوم متحركة', 'Cartoons', 'kids'), ('Football : Ligue 1', 'كرة القدم: الرابطة 1', 'Football: League 1', 'sport'),
    ('Musique du Maghreb', 'موسيقى المغرب', 'Maghreb Music', 'music'), ('Cinéma du soir', 'سينما المساء', 'Evening Movie', 'movie')
  ) v(fr, ar, en, cat) offset ((x.i + abs(hashtext(c.slug))) % 8) limit 1
) p;

-- Live events: one live now, one upcoming, one ended with replay
insert into public.live_events (id, slug, name, description, poster_path, access, published, status, scheduled_at, started_at, stream_path, chat_enabled, record) values
  ('e0000000-0000-4000-8000-000000000001', 'finale', '{"ar":"نهائي كأس تونس","fr":"Finale de la Coupe de Tunisie","en":"Tunisian Cup Final"}', '{"fr":"En direct du stade de Radès. Avant-match dès 19 h."}', 'artwork/finale-backdrop.jpg', 'subscriber', true, 'live', now() - interval '40 minutes', now() - interval '35 minutes', 'live/finale', true, true),
  ('e0000000-0000-4000-8000-000000000002', 'concert-carthage', '{"ar":"حفل قرطاج","fr":"Concert au Festival de Carthage","en":"Carthage Festival Concert"}', '{"fr":"Soirée d’ouverture, en direct de l’amphithéâtre."}', 'artwork/carthage-backdrop.jpg', 'free', true, 'scheduled', now() + interval '2 days', null, 'live/concert-carthage', true, true);
insert into public.live_event_keys (event_id, key_hash) values ('e0000000-0000-4000-8000-000000000001', encode(sha256(convert_to('demo-key', 'utf8')), 'hex')), ('e0000000-0000-4000-8000-000000000002', encode(sha256(convert_to('demo-key-2', 'utf8')), 'hex'));
insert into public.chat_messages (event_id, user_id, display_name, body, created_at) values
  ('e0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Leila', 'يا رب الليلة 🏆', now() - interval '6 minutes'),
  ('e0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Samir', 'Quelle ambiance à Radès !', now() - interval '4 minutes'),
  ('e0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Admin Chouf', 'Bienvenue à tous, bon match 👋', now() - interval '3 minutes'),
  ('e0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Leila', 'هدف قريب إن شاء الله', now() - interval '1 minute');
