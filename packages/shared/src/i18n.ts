import type { I18nText } from './database.types';

export const LOCALES = ['ar', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ar';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return locale === 'ar';
}

const FALLBACK_ORDER: Record<Locale, Locale[]> = {
  ar: ['ar', 'fr', 'en'],
  fr: ['fr', 'ar', 'en'],
  en: ['en', 'fr', 'ar'],
};

/** Picks the best translation of a catalog text, falling back to the other languages. */
export function pickText(text: I18nText | null | undefined, locale: Locale): string {
  if (!text) return '';
  // Unknown locale (e.g. a stray /favicon.ico reaching the [locale] route): use the French order.
  for (const l of FALLBACK_ORDER[locale] ?? FALLBACK_ORDER.fr) {
    const value = text[l]?.trim();
    if (value) return value;
  }
  return '';
}

/** Formats a price stored in millimes (1 TND = 1000 millimes). */
export function formatPrice(millimes: number, currency: string, locale: Locale): string {
  const intlLocale = locale === 'ar' ? 'ar-TN' : locale === 'fr' ? 'fr-TN' : 'en-TN';
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency, maximumFractionDigits: 3 }).format(
    millimes / 1000,
  );
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}
