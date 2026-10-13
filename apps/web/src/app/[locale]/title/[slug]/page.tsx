import { type Locale, formatDuration, pickText } from '@chouf/shared';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { Link } from '@/i18n/navigation';
import { artworkUrl } from '@/server/catalog';
import { createUserClient } from '@/server/supabase';
import { getViewer } from '@/server/auth';
import { getActiveProfile, visibleRatings } from '@/server/profile';

type Props = { params: Promise<{ locale: Locale; slug: string }> };

const loadTitle = cache(async (slug: string) => {
  const db = await createUserClient();
  const { data } = await db
    .from('titles')
    .select('*, seasons(id, number, name, episodes(id, number, name, synopsis, duration_seconds, access, status, asset_id))')
    .eq('slug', slug)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const title = await loadTitle(slug);
  if (!title) return {};
  return { title: pickText(title.name, locale), description: pickText(title.synopsis, locale).slice(0, 160) };
}

export default async function TitlePage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const title = await loadTitle(slug);
  if (!title) notFound();
  const profile = await getActiveProfile(await getViewer());
  if (!visibleRatings(profile).includes(title.maturity_rating)) notFound();
  const t = await getTranslations('title');

  const name = pickText(title.name, locale);
  const poster = artworkUrl(title.poster_path);
  const backdrop = artworkUrl(title.backdrop_path);
  const seasons = [...(title.seasons ?? [])].sort((a, b) => a.number - b.number);

  return (
    <article>
      <div className="relative isolate">
        {backdrop && <img src={backdrop} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink to-ink/40" />
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row">
          {poster && <img src={poster} alt={name} className="w-44 shrink-0 self-start rounded-lg ring-1 ring-line sm:w-56" />}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-black sm:text-4xl">{name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              {title.release_year && <span>{title.release_year}</span>}
              {title.maturity_rating !== 'all' && <span className="rounded border border-line px-1.5">{title.maturity_rating}</span>}
              {title.duration_seconds && <span>{formatDuration(title.duration_seconds)}</span>}
              {title.kind === 'series' && <span>{t('seasons', { count: seasons.length })}</span>}
              <span className={title.access === 'free' ? 'text-emerald-400' : 'text-amber-400'}>{t(title.access)}</span>
            </div>
            <p className="max-w-3xl leading-relaxed text-white/85">{pickText(title.synopsis, locale)}</p>
            {title.kind === 'movie' &&
              (title.asset_id ? (
                <Link href={`/watch/${title.id}`} className="self-start rounded-md bg-brand px-6 py-2.5 font-semibold hover:bg-brand-dark">
                  ▶ {t('play')}
                </Link>
              ) : (
                <span className="self-start rounded-md bg-panel px-6 py-2.5 text-muted">{t('notAvailable')}</span>
              ))}
          </div>
        </div>
      </div>

      {seasons.map((season) => (
        <section key={season.id} className="mx-auto max-w-7xl px-4 py-4">
          <h2 className="mb-3 text-xl font-bold">
            {pickText(season.name, locale) || t('season', { number: season.number })}
          </h2>
          <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {[...season.episodes].sort((a, b) => a.number - b.number).map((ep) => (
              <li key={ep.id}>
                <Link
                  href={ep.asset_id ? `/watch/${title.id}?episode=${ep.id}` : `/title/${title.slug}`}
                  aria-disabled={!ep.asset_id}
                  className="flex items-center gap-4 bg-panel/60 px-4 py-3 hover:bg-panel aria-disabled:pointer-events-none aria-disabled:opacity-50"
                >
                  <span className="w-8 text-center text-lg font-bold text-muted">{ep.number}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{pickText(ep.name, locale) || t('episode', { number: ep.number })}</span>
                    <span className="line-clamp-1 text-sm text-muted">{pickText(ep.synopsis, locale)}</span>
                  </span>
                  {ep.duration_seconds && <span className="text-sm text-muted">{formatDuration(ep.duration_seconds)}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </article>
  );
}
