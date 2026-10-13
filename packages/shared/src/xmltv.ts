// Minimal XMLTV reader: enough for programme guides (channels, programmes, titles, descriptions,
// categories, ratings), without an XML dependency so it runs in the worker and in Workers alike.
import type { I18nText } from './database.types';

export interface XmltvChannel {
  id: string;
  names: string[];
}

export interface XmltvProgramme {
  channelId: string;
  /** ISO timestamps (UTC). */
  start: string;
  end: string;
  title: I18nText;
  description: I18nText;
  category: string | null;
  rating: string | null;
}

export interface XmltvDocument {
  channels: XmltvChannel[];
  programmes: XmltvProgramme[];
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/g, (m, code: string) => {
      if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
      if (code.startsWith('#')) return String.fromCodePoint(Number(code.slice(1)));
      return ENTITIES[code] ?? m;
    });
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`).exec(tag) ?? new RegExp(`\\s${name}\\s*=\\s*'([^']*)'`).exec(tag);
  return m ? decodeXml(m[1]!) : null;
}

/** Elements `<name …>…</name>` inside a fragment, as [openingTag, innerText]. */
function elements(fragment: string, name: string): [string, string][] {
  const re = new RegExp(`<${name}(\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'g');
  const out: [string, string][] = [];
  for (const m of fragment.matchAll(re)) out.push([`<${name}${m[1] ?? ''}>`, m[2] ?? '']);
  return out;
}

/** XMLTV dates: YYYYMMDDHHMMSS [+-HHMM]; a missing offset means UTC. */
export function parseXmltvDate(value: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?\s*(?:([+-])(\d{2})(\d{2}))?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h = '00', mi = '00', s = '00', sign, oh, om] = m;
  let ms = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  if (sign) ms -= (sign === '+' ? 1 : -1) * (Number(oh) * 60 + Number(om)) * 60_000;
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

const LANG_MAP: Record<string, 'ar' | 'fr' | 'en'> = { ar: 'ar', ara: 'ar', fr: 'fr', fra: 'fr', fre: 'fr', en: 'en', eng: 'en' };

function i18n(items: [string, string][], fallback: 'ar' | 'fr' | 'en'): I18nText {
  const out: I18nText = {};
  for (const [tag, text] of items) {
    const value = decodeXml(text).trim();
    if (!value) continue;
    const lang = LANG_MAP[(attr(tag, 'lang') ?? '').toLowerCase()] ?? fallback;
    out[lang] ??= value;
  }
  return out;
}

export function parseXmltv(xml: string, fallbackLang: 'ar' | 'fr' | 'en' = 'fr'): XmltvDocument {
  const channels = elements(xml, 'channel').map(([tag, inner]) => ({
    id: attr(tag, 'id') ?? '',
    names: elements(inner, 'display-name').map(([, t]) => decodeXml(t).trim()).filter(Boolean),
  }));
  const programmes: XmltvProgramme[] = [];
  for (const [tag, inner] of elements(xml, 'programme')) {
    const start = parseXmltvDate(attr(tag, 'start') ?? '');
    const end = parseXmltvDate(attr(tag, 'stop') ?? '');
    const channelId = attr(tag, 'channel');
    const title = i18n(elements(inner, 'title'), fallbackLang);
    if (!start || !end || !channelId || end <= start || Object.keys(title).length === 0) continue;
    const ratingValue = elements(inner, 'rating').flatMap(([, r]) => elements(r, 'value')).map(([, v]) => decodeXml(v).trim())[0];
    programmes.push({
      channelId,
      start,
      end,
      title,
      description: i18n(elements(inner, 'desc'), fallbackLang),
      category: elements(inner, 'category').map(([, c]) => decodeXml(c).trim())[0] ?? null,
      rating: ratingValue ?? null,
    });
  }
  return { channels, programmes };
}

/**
 * Programmes of one XMLTV channel inside a time window, sorted, with overlaps trimmed so a
 * programme never ends after the next one starts (guides from some providers are sloppy).
 */
export function selectProgrammes(doc: XmltvDocument, channelId: string, fromIso: string, toIso: string): XmltvProgramme[] {
  const list = doc.programmes
    .filter((p) => p.channelId === channelId && p.end > fromIso && p.start < toIso)
    .sort((a, b) => a.start.localeCompare(b.start));
  const out: XmltvProgramme[] = [];
  for (const p of list) {
    const prev = out.at(-1);
    if (prev && prev.start === p.start) continue; // exact duplicate slot: keep the first
    if (prev && prev.end > p.start) prev.end = p.start;
    out.push({ ...p });
  }
  return out.filter((p) => p.end > p.start);
}
