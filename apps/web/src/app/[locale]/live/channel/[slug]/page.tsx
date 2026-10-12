import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Player } from '@/components/Player';
import { createUserClient } from '@/server/supabase';

export const dynamic = 'force-dynamic';

export default async function ChannelPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const db = await createUserClient();
  const { data: channel } = await db.from('channels').select('id, name, active_source_id').eq('slug', slug).maybeSingle();
  if (!channel) notFound();
  const t = await getTranslations('live');
  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-6">
      <Player target={{ kind: 'channel', channelId: channel.id }} heading={pickText(channel.name, locale)} backHref="/live" />
      {!channel.active_source_id && <p className="px-4 py-3 text-sm text-muted">{t('channelOffline')}</p>}
    </div>
  );
}
