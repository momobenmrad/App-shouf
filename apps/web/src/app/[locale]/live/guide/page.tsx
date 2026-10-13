import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getViewer } from '@/server/auth';
import { artworkUrl } from '@/server/catalog';
import { guide } from '@/server/epg';
import { getActiveProfile } from '@/server/profile';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

const HOURS = 6;
const PX_PER_HOUR = 220;

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ at?: string }> };

export default async function GuidePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('guide');
  const { at } = await searchParams;
  const requested = at ? new Date(at) : new Date();
  const start = new Date(Number.isNaN(requested.getTime()) ? new Date().getTime() : requested.getTime());
  start.setMinutes(start.getMinutes() < 30 ? 0 : 30, 0, 0);
  const end = new Date(start.getTime() + HOURS * 3_600_000);
  const now = new Date().getTime();

  const db = await createUserClient();
  const profile = await getActiveProfile(await getViewer());
  const rows = await guide(db, start, end, profile?.is_kids ?? false);
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const day = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const shift = (h: number) => `/live/guide?at=${encodeURIComponent(new Date(start.getTime() + h * 3_600_000).toISOString())}`;
  const pct = (iso: string) => Math.max(0, Math.min(1, (new Date(iso).getTime() - start.getTime()) / (HOURS * 3_600_000)));
  const width = HOURS * PX_PER_HOUR;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black">{t('title')}</h1>
        <span className="text-muted">{day.format(start)}</span>
        <span className="ms-auto flex gap-2 text-sm">
          <Link href={shift(-HOURS)} className="rounded border border-line px-3 py-1 hover:bg-panel">‹ {t('earlier')}</Link>
          <Link href="/live/guide" className="rounded border border-line px-3 py-1 hover:bg-panel">{t('now')}</Link>
          <Link href={shift(HOURS)} className="rounded border border-line px-3 py-1 hover:bg-panel">{t('later')} ›</Link>
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="text-muted">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line" dir="ltr">
          <div style={{ width: width + 160 }}>
            <div className="sticky top-0 z-10 flex bg-panel text-xs text-muted">
              <div className="w-40 shrink-0 border-e border-line p-2" />
              <div className="relative h-8" style={{ width }}>
                {Array.from({ length: HOURS * 2 }, (_, i) => (
                  <span key={i} className="absolute top-2 border-s border-line ps-1" style={{ left: (i / (HOURS * 2)) * width }}>
                    {time.format(new Date(start.getTime() + i * 1_800_000))}
                  </span>
                ))}
                {now >= start.getTime() && now < end.getTime() && (
                  <span className="absolute bottom-0 top-0 w-px bg-brand" style={{ left: pct(new Date(now).toISOString()) * width }} />
                )}
              </div>
            </div>
            {rows.map(({ channel, programmes }) => (
              <div key={channel.id} className="flex border-t border-line">
                <Link href={`/live/channel/${channel.slug}`} className="flex w-40 shrink-0 items-center gap-2 border-e border-line p-2 text-sm hover:bg-panel">
                  {artworkUrl(channel.logo_path) ? <img src={artworkUrl(channel.logo_path)!} alt="" className="h-6 w-10 object-contain" /> : <span>📺</span>}
                  <span className="line-clamp-2">{pickText(channel.name, locale)}</span>
                </Link>
                <div className="relative h-14" style={{ width }}>
                  {programmes.length === 0 && <span className="absolute inset-y-0 start-2 flex items-center text-xs text-muted">{t('noData')}</span>}
                  {programmes.map((p) => {
                    const left = pct(p.start) * width;
                    const right = pct(p.end) * width;
                    const live = new Date(p.start).getTime() <= now && new Date(p.end).getTime() > now;
                    return (
                      <div
                        key={p.start}
                        title={`${time.format(new Date(p.start))} – ${time.format(new Date(p.end))} · ${pickText(p.title, locale)}`}
                        className={`absolute inset-y-1 overflow-hidden rounded border px-2 py-1 text-xs ${live ? 'border-brand bg-brand/20' : 'border-line bg-panel'}`}
                        style={{ left, width: Math.max(right - left - 2, 4) }}
                      >
                        <div className="line-clamp-1 font-semibold">{pickText(p.title, locale)}</div>
                        <div className="text-muted">{time.format(new Date(p.start))}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
