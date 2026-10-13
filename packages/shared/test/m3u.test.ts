import { describe, expect, it } from 'vitest';
import { guessCategory, parseM3u, playlistToDrafts, slugify, splitI18nName } from '../src/m3u';

const PLAYLIST = `﻿#EXTM3U x-tvg-url="http://example.org/epg/tunisie.xml"

#EXTINF:-1 tvg-id="watania1.tn" tvg-name="Watania 1" tvg-country="TN" tvg-language="ar" group-title="TV - Service public",الوطنية 1 | Watania 1
http://example.org/stream/watania1.m3u8
#EXTINF:-1 tvg-id="elhiwarettounsi.tn" tvg-country="TN" group-title="TV - Généralistes",الحوار التونسي | El Hiwar Ettounsi
http://example.org/stream/elhiwar.m3u8?token=1
#EXTINF:-1 tvg-id="zitounatv.tn" group-title="TV - Religieux",الزيتونة | Zitouna TV
http://example.org/stream/zitounatv.m3u8
#EXTINF:-1 group-title="Sport, live",Sport "Plus", HD
http://example.org/stream/sport.m3u8
#EXTINF:-1 tvg-id="mosaiquefm.tn" group-title="Radio - Privées" radio="true",موزاييك أف أم | Mosaïque FM
http://example.org/radio/mosaique.mp3
#EXTINF:-1 tvg-id="watania1.tn",Watania 1 (copie)
http://example.org/stream/watania1-backup.m3u8
#EXTINF:-1,Sans adresse
#EXTINF:-1,Adresse cassée
ftp://example.org/x
http://example.org/orphan.m3u8
`;

describe('parseM3u', () => {
  const parsed = parseM3u(PLAYLIST);

  it('reads the header and every well-formed entry', () => {
    expect(parsed.header['x-tvg-url']).toBe('http://example.org/epg/tunisie.xml');
    expect(parsed.entries).toHaveLength(6);
    expect(parsed.entries[0]).toMatchObject({ name: 'الوطنية 1 | Watania 1', url: 'http://example.org/stream/watania1.m3u8', line: 3 });
    expect(parsed.entries[0]!.attrs).toMatchObject({ 'tvg-id': 'watania1.tn', 'tvg-country': 'TN', 'group-title': 'TV - Service public' });
  });

  it('keeps commas inside quoted attributes and splits the name on the right comma', () => {
    expect(parsed.entries[3]).toMatchObject({ name: 'Sport "Plus", HD' });
    expect(parsed.entries[3]!.attrs['group-title']).toBe('Sport, live');
  });

  it('reports entries without URL, invalid URLs and orphan URLs with line numbers', () => {
    expect(parsed.errors).toEqual([
      { line: 15, message: 'entrée sans adresse de flux' },
      { line: 17, message: 'adresse invalide : ftp://example.org/x' },
      { line: 18, message: 'adresse sans #EXTINF' },
    ]);
  });

  it('applies #EXTGRP when no group-title is set', () => {
    const { entries } = parseM3u('#EXTM3U\n#EXTINF:-1,Kids One\n#EXTGRP:Enfants\nhttp://example.org/k.m3u8\n');
    expect(entries[0]!.attrs['group-title']).toBe('Enfants');
  });
});

describe('helpers', () => {
  it('splits bilingual names by script', () => {
    expect(splitI18nName('الوطنية 1 | Watania 1')).toEqual({ ar: 'الوطنية 1', fr: 'Watania 1' });
    expect(splitI18nName('Nessma')).toEqual({ fr: 'Nessma' });
    expect(splitI18nName('نسمة')).toEqual({ ar: 'نسمة' });
  });

  it('builds slugs from tvg-id or names', () => {
    expect(slugify('watania1.tn')).toBe('watania1');
    expect(slugify('Carthage+ HD')).toBe('carthage-hd');
    expect(slugify('Télé Économie')).toBe('tele-economie');
    expect(slugify('نسمة')).toBe('');
  });

  it('guesses categories from group and name', () => {
    expect(guessCategory('Sport, live', 'X')).toBe('sports');
    expect(guessCategory('TV - Religieux', 'Zitouna')).toBe('religious');
    expect(guessCategory(undefined, 'Chouf Kids')).toBe('kids');
    expect(guessCategory('TV - Service public', 'Watania 1')).toBe('general');
  });
});

describe('playlistToDrafts', () => {
  it('maps entries to channel drafts, drops radios and duplicates, keeps the EPG URL', () => {
    const result = playlistToDrafts(PLAYLIST);
    expect(result.epgUrl).toBe('http://example.org/epg/tunisie.xml');
    expect(result.drafts.map((d) => d.slug)).toEqual(['watania1', 'elhiwarettounsi', 'zitounatv', 'sport-plus-hd']);
    expect(result.drafts[0]).toMatchObject({
      name: { ar: 'الوطنية 1', fr: 'Watania 1' },
      category: 'general',
      country: 'TN',
      language: 'ar',
      epg_channel_id: 'watania1.tn',
      hls: true,
      radio: false,
    });
    expect(result.drafts[1]!.hls).toBe(true); // query string ignored
    expect(result.drafts[2]!.category).toBe('religious');
    expect(result.skipped.map((s) => s.reason)).toEqual(['radio', 'doublon de « watania1 »']);
  });

  it('includes radios on request and applies default country/language', () => {
    const result = playlistToDrafts('#EXTM3U\n#EXTINF:-1 radio="true",Radio Test\nhttp://example.org/r.mp3\n', { includeRadios: true, defaultCountry: 'DZ', defaultLanguage: 'fr' });
    expect(result.drafts[0]).toMatchObject({ slug: 'radio-test', radio: true, hls: false, country: 'DZ', language: 'fr', epg_channel_id: null });
  });

  it('skips entries whose name yields no slug (Arabic-only name without tvg-id)', () => {
    const result = playlistToDrafts('#EXTM3U\n#EXTINF:-1,نسمة\nhttp://example.org/n.m3u8\n');
    expect(result.drafts).toEqual([]);
    expect(result.skipped[0]!.reason).toBe('nom inutilisable');
  });
});
