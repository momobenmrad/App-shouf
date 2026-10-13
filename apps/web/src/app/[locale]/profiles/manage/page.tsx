import type { Locale } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProfileForm } from '@/components/ProfileForm';
import { Link } from '@/i18n/navigation';
import { deleteProfileAction } from '@/server/actions/profiles';
import { getViewer } from '@/server/auth';
import { createUserClient } from '@/server/supabase';

export default async function ManageProfiles({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login`);
  const t = await getTranslations('profiles');
  const db = await createUserClient();
  const { data: profiles } = await db.from('viewer_profiles').select('*').order('created_at');

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('manage')}</h1>
        <Link href="/profiles" className="text-sm text-muted hover:text-white">← {t('back')}</Link>
      </div>
      {(profiles ?? []).map((p) => (
        <details key={p.id} className="rounded-lg border border-line">
          <summary className="flex cursor-pointer items-center gap-3 p-3">
            <ProfileAvatar avatar={p.avatar} color={p.color} size="sm" />
            <span className="flex-1 font-semibold">{p.name}</span>
            {p.is_kids && <span className="text-xs text-emerald-400">{t('kids')}</span>}
            {!p.is_default && (
              <form action={deleteProfileAction}>
                <input type="hidden" name="id" value={p.id} /><input type="hidden" name="locale" value={locale} />
                <button className="text-xs text-red-400">{t('delete')}</button>
              </form>
            )}
          </summary>
          <div className="p-3 pt-0"><ProfileForm profile={p} locale={locale} /></div>
        </details>
      ))}
      {(profiles?.length ?? 0) < 5 && (
        <section>
          <h2 className="mb-3 font-semibold">{t('add')}</h2>
          <ProfileForm locale={locale} />
        </section>
      )}
    </div>
  );
}
