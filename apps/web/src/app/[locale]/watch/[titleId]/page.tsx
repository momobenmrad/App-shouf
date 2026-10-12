import { type Locale, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Player } from '@/components/Player';
import { createUserClient } from '@/server/supabase';

type Props = { params: Promise<{ locale: Locale; titleId: string }>; searchParams: Promise<{ episode?: string }> };

const UUID = /^[0-9a-f-]{36}$/;

export default async function WatchPage({ params, searchParams }: Props) {
  const { locale, titleId } = await params;
  setRequestLocale(locale);
  const { episode } = await searchParams;
  if (!UUID.test(titleId) || (episode && !UUID.test(episode))) notFound();

  const db = await createUserClient();
  const { data: title } = await db.from('titles').select('id, slug, name').eq('id', titleId).maybeSingle();
  if (!title) notFound();
  let heading = pickText(title.name, locale);
  if (episode) {
    const { data: ep } = await db.from('episodes').select('number, name').eq('id', episode).maybeSingle();
    if (!ep) notFound();
    const t = await getTranslations('title');
    heading = `${heading} — ${pickText(ep.name, locale) || t('episode', { number: ep.number })}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-0 py-0 sm:px-4 sm:py-6">
      <Player titleId={title.id} episodeId={episode} heading={heading} backHref={`/title/${title.slug}`} />
    </div>
  );
}
