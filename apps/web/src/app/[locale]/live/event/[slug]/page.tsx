import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Chat } from '@/components/Chat';
import { Player } from '@/components/Player';
import { Link } from '@/i18n/navigation';
import { getViewer } from '@/server/auth';
import { env } from '@/server/env';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export default async function EventPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const db = await createUserClient();
  const { data: event } = await db
    .from('live_events')
    .select('id, name, description, status, scheduled_at, chat_enabled, replay_asset_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!event) notFound();
  const t = await getTranslations('live');
  const viewer = await getViewer();
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short' });

  const [{ data: messages }, { data: replay }] = await Promise.all([
    event.chat_enabled
      ? db.from('chat_messages').select('id, display_name, body, created_at, user_id').eq('event_id', event.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [] }),
    event.replay_asset_id ? db.from('titles').select('slug').eq('asset_id', event.replay_asset_id).eq('status', 'published').maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-0 py-0 sm:px-4 sm:py-6 lg:grid-cols-[1fr_340px]">
      <div>
        {event.status === 'live' ? (
          <Player target={{ kind: 'event', eventId: event.id }} heading={pickText(event.name, locale)} backHref="/live" />
        ) : (
          <div className="space-y-3 px-4 sm:px-0">
            <h1 className="text-2xl font-bold">{pickText(event.name, locale)}</h1>
            <div className="flex aspect-video items-center justify-center rounded-lg bg-panel text-center text-muted">
              {event.status === 'scheduled'
                ? event.scheduled_at
                  ? t('startsAt', { date: date.format(new Date(event.scheduled_at)) })
                  : t('soon')
                : replay
                  ? <Link href={`/title/${replay.slug}`} className="rounded-md bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark">{t('watchReplay')}</Link>
                  : t('ended')}
            </div>
          </div>
        )}
        <p className="px-4 pt-3 text-white/80 sm:px-0">{pickText(event.description, locale)}</p>
      </div>
      {event.chat_enabled && (
        <Chat
          eventId={event.id}
          initial={[...(messages ?? [])].reverse()}
          userId={viewer?.user.id ?? null}
          isAdmin={viewer?.profile.role === 'admin'}
          supabaseUrl={env().NEXT_PUBLIC_SUPABASE_URL}
          supabaseAnonKey={env().NEXT_PUBLIC_SUPABASE_ANON_KEY}
        />
      )}
    </div>
  );
}
