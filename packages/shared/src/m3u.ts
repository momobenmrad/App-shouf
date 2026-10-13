// M3U / M3U8 playlist import (IPTV "extended M3U": #EXTINF with tvg-* attributes).
// Used by the back-office to create channel records in bulk. Stream URLs are never turned into
// sources automatically: each source needs its own licence (see channel_sources.license_info).
import type { ChannelRow, I18nText } from './database.types';

export interface M3uEntry {
  /** Display name after the last comma of #EXTINF. */
  name: string;
  url: string;
  attrs: Record<string, string>;
  /** Line number of the #EXTINF (1-based), for error reporting. */
  line: number;
}

export interface M3uParseResult {
  entries: M3uEntry[];
  /** Global attributes of the #EXTM3U header (e.g. x-tvg-url). */
  header: Record<string, string>;
  errors: { line: number; message: string }[];
}

const ATTR_RE = /([A-Za-z0-9_-]+)="([^"]*)"/g;

function parseAttrs(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of text.matchAll(ATTR_RE)) out[m[1]!.toLowerCase()] = m[2]!.trim();
  return out;
}

/** Index of the comma that separates attributes from the display name (commas inside quotes ignored). */
function nameSeparator(line: string): number {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) return i;
  }
  return -1;
}

export function parseM3u(text: string): M3uParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const entries: M3uEntry[] = [];
  const errors: M3uParseResult['errors'] = [];
  let header: Record<string, string> = {};
  let pending: { name: string; attrs: Record<string, string>; line: number } | null = null;

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const lineNo = i + 1;
    if (!line) return;
    if (line.startsWith('#EXTM3U')) {
      header = parseAttrs(line.slice(7));
      return;
    }
    if (line.startsWith('#EXTINF:')) {
      if (pending) errors.push({ line: pending.line, message: 'entrée sans adresse de flux' });
      const body = line.slice(8);
      const sep = nameSeparator(body);
      const name = (sep >= 0 ? body.slice(sep + 1) : '').trim();
      const attrs = parseAttrs(sep >= 0 ? body.slice(0, sep) : body);
      pending = { name: name || attrs['tvg-name'] || '', attrs, line: lineNo };
      return;
    }
    if (line.startsWith('#')) {
      // #EXTGRP:<group> applies to the pending entry; other directives are ignored.
      if (pending && line.startsWith('#EXTGRP:') && !pending.attrs['group-title']) pending.attrs['group-title'] = line.slice(8).trim();
      return;
    }
    if (!pending) {
      errors.push({ line: lineNo, message: 'adresse sans #EXTINF' });
      return;
    }
    if (!/^(https?|rtmps?|srt|udp|rtp):\/\//i.test(line)) {
      errors.push({ line: lineNo, message: `adresse invalide : ${line.slice(0, 80)}` });
    } else if (!pending.name) {
      errors.push({ line: pending.line, message: 'entrée sans nom' });
    } else {
      entries.push({ name: pending.name, url: line, attrs: pending.attrs, line: pending.line });
    }
    pending = null;
  });
  if (pending) errors.push({ line: (pending as { line: number }).line, message: 'entrée sans adresse de flux' });
  return { entries, header, errors };
}

// Mapping to Chouf channels ---------------------------------------------------------------------

export type ChannelCategory = ChannelRow['category'];

const CATEGORY_RULES: [RegExp, ChannelCategory][] = [
  [/sport|رياض/i, 'sports'],
  [/news|info|actu|أخبار|اخبار/i, 'news'],
  [/kid|enfant|jeunesse|child|cartoon|أطفال|اطفال/i, 'kids'],
  [/relig|islam|coran|quran|قرآن|دين|زيتونة/i, 'religious'],
  [/music|musique|موسيق/i, 'music'],
  [/docu|وثائق/i, 'documentary'],
  [/divert|entertain|série|serie|ciné|cine|movie|film|مسلسل|ترفيه/i, 'entertainment'],
];

export function guessCategory(group: string | undefined, name: string): ChannelCategory {
  const haystack = `${group ?? ''} ${name}`;
  for (const [re, cat] of CATEGORY_RULES) if (re.test(haystack)) return cat;
  return 'general';
}

const ARABIC = /[؀-ۿ]/;

/** Removes quality/status tags common in public playlists: "(1080p)", "(HEVC)", "[Not 24/7]", "[Geo-blocked]". */
export function cleanChannelName(name: string): string {
  return name
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*\((?:\d{3,4}[pi]|hevc|4k|uhd|fhd|hd|sd)\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** "ElWatania1.tn@SD" → { base: "ElWatania1.tn", country: "TN" } (iptv-org style ids carry a feed suffix). */
export function parseTvgId(tvgId: string | undefined): { base: string | null; country: string | null } {
  if (!tvgId) return { base: null, country: null };
  const base = tvgId.split('@')[0]!.trim();
  const m = /\.([a-z]{2})$/i.exec(base);
  return { base: base || null, country: m ? m[1]!.toUpperCase() : null };
}

/** "الوطنية 1 | Watania 1" → { ar: "الوطنية 1", fr: "Watania 1" }; a single name goes to ar or fr by script. */
export function splitI18nName(name: string): I18nText {
  const parts = name.split(/\s+[|/]\s+/).map((p) => p.trim()).filter(Boolean);
  const out: I18nText = {};
  for (const p of parts) {
    if (ARABIC.test(p)) out.ar ??= p;
    else out.fr ??= p;
  }
  return Object.keys(out).length ? out : { fr: name.trim() };
}

export function slugify(value: string): string {
  const s = value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/@[a-z0-9]+$/, '')
    .replace(/\.[a-z]{2}$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return s;
}

export function isRadioEntry(entry: M3uEntry): boolean {
  if (entry.attrs['radio'] === 'true') return true;
  if (/radio|إذاعة|اذاعة|\bfm\b/i.test(entry.attrs['group-title'] ?? '')) return true;
  return /\.(mp3|aac|ogg|opus)(\?|$)/i.test(entry.url);
}

export interface ChannelDraft {
  slug: string;
  name: I18nText;
  category: ChannelCategory;
  country: string;
  language: string;
  epg_channel_id: string | null;
  /** Kept for the operator: becomes a source only once a licence is entered. */
  stream_url: string;
  hls: boolean;
  radio: boolean;
  line: number;
}

export interface DraftOptions {
  defaultCountry?: string;
  defaultLanguage?: string;
}

export function toChannelDraft(entry: M3uEntry, opts: DraftOptions = {}): ChannelDraft | null {
  const name = splitI18nName(cleanChannelName(entry.name));
  const tvg = parseTvgId(entry.attrs['tvg-id']);
  const slug = slugify(tvg.base || entry.attrs['tvg-name'] || name.fr || name.en || entry.name) || slugify(name.fr ?? '');
  if (!slug) return null;
  const country = ((entry.attrs['tvg-country'] ?? '').split(/[;,]/)[0]?.trim() || tvg.country || '').toUpperCase();
  const language = (entry.attrs['tvg-language'] ?? '').split(/[;,]/)[0]?.trim().toLowerCase();
  return {
    slug,
    name,
    category: guessCategory(entry.attrs['group-title'], entry.name),
    country: country && /^[A-Z]{2}$/.test(country) ? country : (opts.defaultCountry ?? 'TN'),
    language: language && /^[a-z]{2}$/.test(language) ? language : (opts.defaultLanguage ?? 'ar'),
    epg_channel_id: entry.attrs['tvg-id'] || null,
    stream_url: entry.url,
    hls: /^https?:\/\//i.test(entry.url) && /\.m3u8$/i.test(entry.url.split(/[?#]/)[0]!),
    radio: isRadioEntry(entry),
    line: entry.line,
  };
}

/** Drafts for a whole playlist: radios optionally dropped, duplicate slugs merged (first wins). */
export function playlistToDrafts(text: string, opts: DraftOptions & { includeRadios?: boolean } = {}) {
  const parsed = parseM3u(text);
  const drafts: ChannelDraft[] = [];
  const skipped: { line: number; name: string; reason: string }[] = [];
  const seen = new Set<string>();
  for (const entry of parsed.entries) {
    const draft = toChannelDraft(entry, opts);
    if (!draft) {
      skipped.push({ line: entry.line, name: entry.name, reason: 'nom inutilisable' });
    } else if (draft.radio && !opts.includeRadios) {
      skipped.push({ line: entry.line, name: entry.name, reason: 'radio' });
    } else if (seen.has(draft.slug)) {
      skipped.push({ line: entry.line, name: entry.name, reason: `doublon de « ${draft.slug} »` });
    } else {
      seen.add(draft.slug);
      drafts.push(draft);
    }
  }
  return { drafts, skipped, errors: parsed.errors, epgUrl: parsed.header['x-tvg-url'] ?? parsed.header['url-tvg'] ?? null };
}
