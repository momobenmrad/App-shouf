import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Rail } from '@/components/Rail';
import { TitleCard } from '@/components/TitleCard';
import { Link } from '@/i18n/navigation';
import { getViewer } from '@/server/auth';
import { getActiveProfile, visibleRatings } from '@/server/profile';
import { becauseYouWatched, forYou, trending } from '@/server/recommendations';
import { artworkUrl, continueWatching, featuredTitle, latestTitles } from '@/server/catalog';
import { createUserClient } from '@/server/supabase';

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const db = await createUserClient();
  const viewer = await getViewer();
  const profile = await getActiveProfile(viewer);
  const ratings = visibleRatings(profile);
  const [hero, movies, series, resume, hot, picks, because] = await Promise.all([
    featuredTitle(db, ratings),
    latestTitles(db, 'movie', ratings),
    latestTitles(db, 'series', ratings),
    profile ? continueWatching(db, profile.id) : Promise.resolve([]),
    trending(db, ratings),
    profile ? forYou(db, profile, ratings) : Promise.resolve([]),
    profile ? becauseYouWatched(db, profile, ratings) : Promise.resolve(null),
  ]);

  if (!hero && movies.length === 0 && series.length === 0) {
    return <p className="mx-auto max-w-7xl px-4 py-24 text-center text-muted">{t('empty')}</p>;
  }

  const backdrop = artworkUrl(hero?.backdrop_path ?? hero?.poster_path);
  return (
    <>
      {hero && (
        <section className="relative isolate overflow-hidden">
          {backdrop && <img src={backdrop} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="mx-auto flex min-h-[46vh] max-w-7xl flex-col justify-end gap-4 px-4 py-10">
            <h1 className="max-w-2xl text-4xl font-black sm:text-5xl">{pickText(hero.name, locale)}</h1>
            <p className="line-clamp-3 max-w-2xl text-white/80">{pickText(hero.synopsis, locale)}</p>
            <div className="flex gap-3">
              <Link href={`/title/${hero.slug}`} className="rounded-md bg-white px-5 py-2 font-semibold text-ink hover:bg-white/90">
                ▶ {t('watch')}
              </Link>
              <Link href={`/title/${hero.slug}`} className="rounded-md bg-white/15 px-5 py-2 font-semibold hover:bg-white/25">
                {t('more')}
              </Link>
            </div>
          </div>
        </section>
      )}
      {resume.length > 0 && (
        <Rail title={t('continue')}>
          {resume.map((item) => (
            <TitleCard
              key={`${item.title.id}-${item.episodeId ?? ''}`}
              title={item.title}
              locale={locale}
              progress={item.duration ? item.position / item.duration : 0}
            />
          ))}
        </Rail>
      )}
      {because && (
        <Rail title={t('because', { title: pickText(because.seed.name, locale) })}>
          {because.titles.map((m) => (
            <TitleCard key={m.id} title={m} locale={locale} />
          ))}
        </Rail>
      )}
      {picks.length > 0 && (
        <Rail title={t('forYou')}>
          {picks.map((m) => (
            <TitleCard key={m.id} title={m} locale={locale} />
          ))}
        </Rail>
      )}
      {hot.length > 0 && (
        <Rail title={t('trending')}>
          {hot.map((m) => (
            <TitleCard key={m.id} title={m} locale={locale} />
          ))}
        </Rail>
      )}
      {movies.length > 0 && (
        <Rail title={t('latestMovies')}>
          {movies.map((m) => (
            <TitleCard key={m.id} title={m} locale={locale} />
          ))}
        </Rail>
      )}
      {series.length > 0 && (
        <Rail title={t('latestSeries')}>
          {series.map((s) => (
            <TitleCard key={s.id} title={s} locale={locale} />
          ))}
        </Rail>
      )}
    </>
  );
}
