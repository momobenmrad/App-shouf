import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Player } from '@/components/Player';
import { createUserClient } from '@/server/supabase';
import { nowNextByChannel } from '@/server/epg';

export const dynamic = 'force-dynamic';

export default async function ChannelPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const db = await createUserClient();
  const { data: channel } = await db.from('channels').select('id, name, active_source_id').eq('slug', slug).maybeSingle();
  if (!channel) notFound();
  const t = await getTranslations('live');
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const [epg, { data: schedule }] = await Promise.all([
    nowNextByChannel(db),
    db.from('epg_programs').select('title, start_at, end_at').eq('channel_id', channel.id).gte('end_at', dayStart.toISOString()).lt('start_at', dayEnd.toISOString()).order('start_at'),
  ]);
  const nowNext = epg.get(channel.id);
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
  const nowMs = new Date().getTime();
  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-6">
      <Player target={{ kind: 'channel', channelId: channel.id }} heading={pickText(channel.name, locale)} backHref="/live" />
      {!channel.active_source_id && <p className="px-4 py-3 text-sm text-muted">{t('channelOffline')}</p>}
      {nowNext?.now && (
        <div className="flex flex-wrap gap-6 px-4 py-3 text-sm sm:px-0">
          <span><span className="text-brand">● {t('nowOn')}</span> {pickText(nowNext.now.title, locale)} <span className="text-muted">({time.format(new Date(nowNext.now.start))} – {time.format(new Date(nowNext.now.end))})</span></span>
          {nowNext.next && <span className="text-muted">{t('next')} : {pickText(nowNext.next.title, locale)} · {time.format(new Date(nowNext.next.start))}</span>}
        </div>
      )}
      {!!schedule?.length && (
        <section className="px-4 pb-8 sm:px-0">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{t('schedule')}</h2>
          <ol className="divide-y divide-line rounded-lg border border-line text-sm">
            {schedule.map((p) => {
              const live = new Date(p.start_at).getTime() <= nowMs && new Date(p.end_at).getTime() > nowMs;
              return (
                <li key={p.start_at} className={`flex gap-4 px-4 py-2 ${live ? 'bg-brand/10' : new Date(p.end_at).getTime() < nowMs ? 'text-muted' : ''}`}>
                  <span className="w-12 shrink-0 tabular-nums">{time.format(new Date(p.start_at))}</span>
                  <span>{pickText(p.title, locale)}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
