import type { Locale } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Link } from '@/i18n/navigation';
import { switchProfileAction } from '@/server/actions/profiles';
import { getViewer } from '@/server/auth';
import { getActiveProfile } from '@/server/profile';
import { createUserClient } from '@/server/supabase';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ next?: string }> };

export default async function ProfilesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login`);
  const { next } = await searchParams;
  const t = await getTranslations('profiles');
  const db = await createUserClient();
  const [{ data: profiles }, active] = await Promise.all([db.from('viewer_profiles').select('*').order('created_at'), getActiveProfile(viewer)]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="mb-10 text-3xl font-black">{t('who')}</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {(profiles ?? []).map((p) => (
          <form key={p.id} action={switchProfileAction}>
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="locale" value={locale} />
            {next && <input type="hidden" name="next" value={next} />}
            <button className={`group flex w-32 flex-col items-center gap-2 rounded-lg p-2 ${active?.id === p.id ? 'ring-2 ring-brand' : 'hover:bg-panel'}`}>
              <ProfileAvatar avatar={p.avatar} color={p.color} size="lg" />
              <span className="line-clamp-1 text-sm text-white/90">{p.name}</span>
              {p.is_kids && <span className="rounded bg-emerald-700 px-1.5 text-[10px] font-bold uppercase">{t('kids')}</span>}
            </button>
          </form>
        ))}
      </div>
      <Link href="/profiles/manage" className="mt-10 inline-block rounded-md border border-line px-4 py-2 text-sm text-muted hover:text-white">
        {t('manage')}
      </Link>
    </div>
  );
}
