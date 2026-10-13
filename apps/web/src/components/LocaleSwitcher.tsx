'use client';

import { LOCALES, type Locale } from '@chouf/shared';
import { useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';

const LABELS: Record<Locale, string> = { ar: 'العربية', fr: 'Français', en: 'English' };

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => {
        const query = search.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { locale: e.target.value as Locale });
      }}
      className="rounded-md border border-line bg-panel px-2 py-1 text-sm"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LABELS[l]}
        </option>
      ))}
    </select>
  );
}
