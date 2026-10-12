import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Link } from '@/i18n/navigation';
import { getViewer } from '@/server/auth';
import { LocaleSwitcher } from './LocaleSwitcher';

export async function Header() {
  const t = await getTranslations('nav');
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2 text-2xl font-black text-brand">
          <span>شوف</span>
          <span className="text-base font-bold tracking-widest text-white/90">CHOUF</span>
        </Link>
        <nav className="flex flex-1 items-center gap-4 text-sm text-white/80">
          <Link href="/" className="hover:text-white">{t('home')}</Link>
          <Link href="/live" className="hover:text-white">{t('live')}</Link>
          <Link href="/search" className="hover:text-white">{t('search')}</Link>
          {viewer?.profile.role === 'admin' && (
            <Link href="/admin" className="text-amber-400 hover:text-amber-300">{t('admin')}</Link>
          )}
        </nav>
        <Suspense>
          <LocaleSwitcher />
        </Suspense>
        {viewer ? (
          <Link href="/account" className="rounded-md bg-panel px-3 py-1.5 text-sm hover:bg-line">{t('account')}</Link>
        ) : (
          <>
            <Link href="/login" className="text-sm text-white/80 hover:text-white">{t('login')}</Link>
            <Link href="/signup" className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold hover:bg-brand-dark">{t('signup')}</Link>
          </>
        )}
      </div>
    </header>
  );
}
