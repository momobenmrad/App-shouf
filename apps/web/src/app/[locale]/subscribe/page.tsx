import { type Locale, formatPrice, pickText } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutButton } from '@/components/CheckoutButton';
import { createUserClient } from '@/server/supabase';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ payment?: string }> };

export default async function SubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { payment } = await searchParams;
  const t = await getTranslations('subscribe');
  const db = await createUserClient();
  const { data: plans } = await db.from('plans').select('*').eq('active', true).order('sort_order');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-center text-3xl font-black">{t('title')}</h1>
      <p className="mb-8 text-center text-muted">{t('methods')}</p>
      {payment === 'failed' && <p className="mb-6 rounded-md bg-red-900/40 p-3 text-center text-sm">{t('failed')}</p>}
      <div className="grid gap-6 sm:grid-cols-2">
        {(plans ?? []).map((plan) => (
          <div key={plan.id} className="flex flex-col gap-4 rounded-xl border border-line bg-panel p-6">
            <h2 className="text-xl font-bold">{pickText(plan.name, locale)}</h2>
            <p className="text-3xl font-black">
              {formatPrice(plan.price_millimes, plan.currency, locale)}
              <span className="text-base font-normal text-muted"> {plan.interval === 'month' ? t('perMonth') : t('perYear')}</span>
            </p>
            <p className="text-sm text-muted">{t('streams', { count: plan.max_streams })}</p>
            <CheckoutButton planCode={plan.code} label={t('cta')} />
          </div>
        ))}
      </div>
    </div>
  );
}
