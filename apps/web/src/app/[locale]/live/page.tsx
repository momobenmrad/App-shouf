import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { artworkUrl } from '@/server/catalog';
import { nowNextByChannel } from '@/server/epg';
import { createUserClient } from '@/server/supabase';
import { getViewer } from '@/server/auth';
import { getActiveProfile } from '@/server/profile';

export const dynamic = 'force-dynamic';

const CATEGORIES = ['general', 'news', 'sports', 'kids', 'entertainment', 'religious', 'music', 'documentary'] as const;

export default async function LivePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('live');
  const db = await createUserClient();
  const profile = await getActiveProfile(await getViewer());
  const kids = profile?.is_kids ?? false;
  const [{ data: allChannels }, { data: allEvents }] = await Promise.all([
    db.from('channels').select('id, slug, name, logo_path, category, access, active_source_id').eq('status', 'active').order('sort_order'),
    db
      .from('live_events')
      .select('id, slug, name, poster_path, access, status, scheduled_at, started_at')
      .eq('published', true)
      .in('status', ['live', 'scheduled'])
      .order('status')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .limit(20),
  ]);
  const channels = kids ? (allChannels ?? []).filter((c) => c.category === 'kids') : allChannels;
  const epg = await nowNextByChannel(db);
  const events = kids ? [] : allEvents;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  const liveEvents = (events ?? []).filter((e) => e.status === 'live');
  const upcoming = (events ?? []).filter((e) => e.status === 'scheduled');

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {liveEvents.length > 0 && (
        <section>
          <h1 className="mb-4 text-2xl font-black">{t('nowLive')}</h1>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((e) => (
              <Link key={e.id} href={`/live/event/${e.slug}`} className="group relative overflow-hidden rounded-lg border border-line bg-panel">
                {artworkUrl(e.poster_path) ? <img src={artworkUrl(e.poster_path)!} alt="" className="aspect-video w-full object-cover" /> : <div className="aspect-video bg-ink" />}
                <span className="absolute start-2 top-2 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase">{t('liveBadge')}</span>
                <p className="p-3 font-semibold group-hover:text-white">{pickText(e.name, locale)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">{t('channels')}</h2>
          <Link href="/live/guide" className="rounded border border-line px-3 py-1 text-sm hover:bg-panel">📅 {t('guide')}</Link>
        </div>
        {!channels?.length ? (
          <p className="text-muted">{t('noChannels')}</p>
        ) : (
          CATEGORIES.filter((c) => channels.some((ch) => ch.category === c)).map((cat) => (
            <div key={cat} className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t(`categories.${cat}`)}</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {channels
                  .filter((ch) => ch.category === cat)
                  .map((ch) => (
                    <Link key={ch.id} href={`/live/channel/${ch.slug}`} aria-disabled={!ch.active_source_id} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border border-line bg-panel p-3 text-center hover:border-brand aria-disabled:opacity-40">
                      {artworkUrl(ch.logo_path) ? <img src={artworkUrl(ch.logo_path)!} alt="" className="max-h-12 object-contain" /> : <span className="text-2xl">📺</span>}
                      <span className="line-clamp-1 text-xs">{pickText(ch.name, locale)}</span>
                      {epg.get(ch.id)?.now && <span className="line-clamp-1 text-[10px] text-muted">{pickText(epg.get(ch.id)!.now!.title, locale)}</span>}
                      {ch.access === 'free' && <span className="text-[10px] uppercase text-emerald-400">{t('free')}</span>}
                    </Link>
                  ))}
              </div>
            </div>
          ))
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{t('upcoming')}</h2>
          <ul className="divide-y divide-line rounded-lg border border-line">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold">{pickText(e.name, locale)}</span>
                <span className="text-sm text-muted">{e.scheduled_at ? date.format(new Date(e.scheduled_at)) : t('soon')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
