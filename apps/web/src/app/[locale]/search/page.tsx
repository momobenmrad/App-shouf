import type { Locale } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { TitleCard } from '@/components/TitleCard';
import { createUserClient } from '@/server/supabase';
import { getViewer } from '@/server/auth';
import { getActiveProfile, visibleRatings } from '@/server/profile';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const q = ((await searchParams).q ?? '').trim().slice(0, 100);
  const t = await getTranslations('search');

  let results: Awaited<ReturnType<typeof search>> = [];
  if (q.length >= 2) {
    const ratings = visibleRatings(await getActiveProfile(await getViewer()));
    results = (await search(q)).filter((r) => ratings.includes(r.maturity_rating));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <form role="search" className="mb-8">
        <input
          name="q"
          defaultValue={q}
          placeholder={t('placeholder')}
          autoFocus
          className="w-full rounded-lg border border-line bg-panel px-4 py-3 text-lg outline-none focus:border-brand"
        />
      </form>
      {q.length < 2 ? (
        <p className="text-muted">{t('hint')}</p>
      ) : results.length === 0 ? (
        <p className="text-muted">{t('none')}</p>
      ) : (
        <>
          <h1 className="mb-4 text-lg font-bold">{t('results', { q })}</h1>
          <div className="flex flex-wrap gap-4">
            {results.map((r) => (
              <TitleCard key={r.id} title={r} locale={locale} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

async function search(q: string) {
  const db = await createUserClient();
  const { data } = await db.rpc('search_titles', { q, max_results: 30 });
  return data ?? [];
}
