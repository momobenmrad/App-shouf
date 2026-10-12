import { LOCALES, type Locale, formatPrice, isSubscriptionActive, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { signOutAction, updateLocaleAction } from '@/server/actions/auth';
import { getViewer } from '@/server/auth';
import { createUserClient } from '@/server/supabase';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ payment?: string }> };

export default async function AccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) redirect(`/${locale}/login`);
  const { payment } = await searchParams;
  const t = await getTranslations('account');
  const tNav = await getTranslations('nav');
  const db = await createUserClient();
  const [{ data: sub }, { data: payments }] = await Promise.all([
    db.from('subscriptions').select('status, current_period_end, plans(name)').eq('user_id', viewer.user.id).maybeSingle(),
    db.from('payments').select('id, amount_millimes, currency, status, created_at').eq('user_id', viewer.user.id).order('created_at', { ascending: false }).limit(20),
  ]);
  const date = (iso: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(iso));
  const active = isSubscriptionActive(sub);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button className="text-sm text-muted hover:text-white">{tNav('logout')}</button>
        </form>
      </div>
      {payment === 'success' && <p className="rounded-md bg-emerald-900/40 p-3 text-sm">{t('paymentSuccess')}</p>}

      <section className="rounded-lg border border-line bg-panel p-5">
        <p className="text-sm text-muted">{viewer.user.email}</p>
        <h2 className="mb-2 mt-4 font-semibold">{t('subscription')}</h2>
        {sub && active ? (
          <p className="text-emerald-400">
            {pickText((sub.plans as unknown as { name: Record<string, string> } | null)?.name, locale)} — {t('active', { date: date(sub.current_period_end!) })}
          </p>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <p className="text-muted">{sub?.current_period_end ? t('expired', { date: date(sub.current_period_end) }) : t('none')}</p>
            <Link href="/subscribe" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold hover:bg-brand-dark">{tNav('subscribe')}</Link>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-line bg-panel p-5">
        <h2 className="mb-3 font-semibold">{t('language')}</h2>
        <form action={updateLocaleAction} className="flex gap-3">
          <select name="locale" defaultValue={viewer.profile.locale} className="rounded-md border border-line bg-ink px-3 py-2">
            {LOCALES.map((l) => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <button className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/20">{t('save')}</button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">{t('payments')}</h2>
        {!payments?.length ? (
          <p className="text-muted">{t('noPayments')}</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
                <span>{date(p.created_at)}</span>
                <span>{formatPrice(p.amount_millimes, p.currency, locale)}</span>
                <span className={p.status === 'succeeded' ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-muted'}>
                  {t(`status.${p.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
