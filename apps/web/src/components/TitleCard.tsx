import { type Locale, pickText } from '@chouf/shared';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { type CardTitle, artworkUrl } from '@/server/catalog';

export async function TitleCard({ title, locale, progress }: { title: CardTitle; locale: Locale; progress?: number }) {
  const t = await getTranslations('title');
  const name = pickText(title.name, locale);
  const poster = artworkUrl(title.poster_path);
  return (
    <Link href={`/title/${title.slug}`} className="group block w-36 shrink-0 sm:w-44">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-panel ring-1 ring-line transition group-hover:ring-brand">
        {poster ? (
          <img src={poster} alt={name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-sm text-muted">{name}</div>
        )}
        {title.access === 'free' && (
          <span className="absolute start-2 top-2 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase">{t('free')}</span>
        )}
        {progress !== undefined && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div className="h-full bg-brand" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
      </div>
      <p className="mt-2 line-clamp-1 text-sm text-white/90">{name}</p>
    </Link>
  );
}
