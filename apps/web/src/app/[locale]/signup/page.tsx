import type { Locale } from '@chouf/shared';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AuthCard, Field, Submit } from '@/components/AuthForm';
import { Link } from '@/i18n/navigation';
import { signUpAction } from '@/server/actions/auth';

type Props = { params: Promise<{ locale: Locale }>; searchParams: Promise<{ error?: string }> };

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { error } = await searchParams;
  const t = await getTranslations('auth');
  return (
    <AuthCard title={t('signup')}>
      {error && <p className="mb-4 rounded-md bg-red-900/40 p-3 text-sm">{t('signupFailed', { message: error.slice(0, 200) })}</p>}
      <form action={signUpAction}>
        <input type="hidden" name="locale" value={locale} />
        <Field label={t('displayName')} name="displayName" maxLength={80} autoComplete="nickname" />
        <Field label={t('email')} name="email" type="email" autoComplete="email" required />
        <Field label={`${t('password')} (${t('passwordHint')})`} name="password" type="password" autoComplete="new-password" minLength={8} required />
        <Submit>{t('signup')}</Submit>
      </form>
      <p className="mt-6 text-sm text-muted">
        {t('hasAccount')} <Link href="/login" className="text-white underline">{t('login')}</Link>
      </p>
    </AuthCard>
  );
}
