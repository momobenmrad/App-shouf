import { describe, expect, it } from 'vitest';
import { type Locale, pickText } from '../src/i18n';

describe('pickText', () => {
  it('falls back across languages', () => {
    expect(pickText({ ar: 'شوف', fr: 'Chouf' }, 'ar')).toBe('شوف');
    expect(pickText({ fr: 'Chouf' }, 'en')).toBe('Chouf');
    expect(pickText({ en: ' ' }, 'fr')).toBe('');
    expect(pickText(null, 'fr')).toBe('');
  });

  it('does not throw on an unknown locale', () => {
    expect(pickText({ ar: 'شوف', fr: 'Chouf' }, 'favicon.ico' as Locale)).toBe('Chouf');
  });
});
