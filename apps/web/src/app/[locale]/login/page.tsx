import type { Locale } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthCard, Field, Submit } from '@/components/AuthForm';
import { Link } from '@/i18n/navigation';
import { signInAction } from '@/server/actions/auth';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ error?: string; next?: string; notice?: string }> };

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error, next, notice } = await searchParams;
  const t = await getTranslations('auth');
  return (
    <AuthCard title={t('login')}>
      {notice === 'check-email' && <p className="mb-4 rounded-md bg-emerald-900/40 p-3 text-sm">{t('checkEmail')}</p>}
      {error && <p className="mb-4 rounded-md bg-red-900/40 p-3 text-sm">{t('invalid')}</p>}
      <form action={signInAction}>
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <Field label={t('email')} name="email" type="email" autoComplete="email" required />
        <Field label={t('password')} name="password" type="password" autoComplete="current-password" minLength={8} required />
        <Submit>{t('login')}</Submit>
      </form>
      <p className="mt-6 text-sm text-muted">
        {t('noAccount')} <Link href="/signup" className="text-white underline">{t('signup')}</Link>
      </p>
    </AuthCard>
  );
}
