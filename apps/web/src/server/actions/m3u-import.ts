'use server';

import { playlistToDrafts } from '@chouf/shared';
import { revalidatePath } from 'next/cache';
import { getAdmin } from '../auth';
import { createUserClient } from '../supabase';

const MAX_PLAYLIST_BYTES = 2 * 1024 * 1024;
const MAX_CHANNELS = 500;

export interface ImportResult {
  error?: string;
  created?: { slug: string; name: string }[];
  existing?: string[];
  skipped?: { line: number; name: string; reason: string }[];
  parseErrors?: { line: number; message: string }[];
}

/**
 * Creates one inactive channel per playlist entry. Stream URLs are NOT turned into sources:
 * a source needs its licence (holder, agreement, expiry, territories), entered per channel.
 */
export async function importM3uAction(_prev: ImportResult, form: FormData): Promise<ImportResult> {
  if (!(await getAdmin())) return { error: 'Accès réservé aux administrateurs.' };
  const text = String(form.get('playlist') ?? '');
  if (!text.trim()) return { error: 'Collez une playlist ou choisissez un fichier .m3u.' };
  if (new TextEncoder().encode(text).length > MAX_PLAYLIST_BYTES) return { error: 'Playlist trop volumineuse (2 Mo maximum).' };
  if (!text.trimStart().replace(/^﻿/, '').startsWith('#EXTM3U')) return { error: 'Ce n’est pas une playlist M3U (la première ligne doit être #EXTM3U).' };

  const country = String(form.get('country') ?? 'TN').toUpperCase();
  const language = String(form.get('language') ?? 'ar').toLowerCase();
  const access = form.get('access') === 'free' ? 'free' : 'subscriber';
  const { drafts, skipped, errors } = playlistToDrafts(text, {
    includeRadios: form.get('include_radios') === 'on',
    defaultCountry: /^[A-Z]{2}$/.test(country) ? country : 'TN',
    defaultLanguage: /^[a-z]{2}$/.test(language) ? language : 'ar',
  });
  if (drafts.length === 0) return { error: 'Aucune chaîne importable dans cette playlist.', skipped, parseErrors: errors };
  if (drafts.length > MAX_CHANNELS) return { error: `Trop de chaînes (${drafts.length}). Maximum ${MAX_CHANNELS} par import.` };

  const db = await createUserClient();
  const { data: existingRows, error: readError } = await db.from('channels').select('slug').in('slug', drafts.map((d) => d.slug));
  if (readError) return { error: readError.message };
  const existing = new Set((existingRows ?? []).map((r) => r.slug));
  const toCreate = drafts.filter((d) => !existing.has(d.slug));

  const { data: maxRow } = await db.from('channels').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
  let order = (maxRow?.sort_order ?? 0) + 1;

  if (toCreate.length) {
    const { error } = await db.from('channels').insert(
      toCreate.map((d) => ({
        slug: d.slug,
        name: d.name,
        category: d.category,
        country: d.country,
        language: d.language,
        epg_channel_id: d.epg_channel_id,
        status: 'inactive' as const,
        access,
        sort_order: order++,
      })),
    );
    if (error) return { error: error.message };
  }

  revalidatePath('/fr/admin/channels');
  return {
    created: toCreate.map((d) => ({ slug: d.slug, name: d.name.fr ?? d.name.ar ?? d.slug })),
    existing: drafts.filter((d) => existing.has(d.slug)).map((d) => d.slug),
    skipped,
    parseErrors: errors,
  };
}
