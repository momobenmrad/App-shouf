'use server';

import { episodeUpsertSchema, seasonUpsertSchema, titleUpsertSchema } from '@chouf/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdmin } from '../auth';
import { createUserClient } from '../supabase';

// Writes go through the user's own client: RLS (is_admin) is the final gate.
async function adminDb() {
  if (!(await getAdmin())) throw new Error('forbidden');
  return createUserClient();
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
};
const i18n = (form: FormData, prefix: string) => ({ ar: text(form, `${prefix}_ar`), fr: text(form, `${prefix}_fr`), en: text(form, `${prefix}_en`) });
const nullable = (v: string) => (v.trim() === '' ? null : v.trim());

export type ActionState = { error?: string; ok?: boolean };

export async function saveTitleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const db = await adminDb();
  const id = nullable(text(form, 'id'));
  const parsed = titleUpsertSchema.safeParse({
    kind: text(form, 'kind'),
    slug: text(form, 'slug'),
    name: i18n(form, 'name'),
    synopsis: i18n(form, 'synopsis'),
    release_year: nullable(text(form, 'release_year')),
    maturity_rating: text(form, 'maturity_rating') || 'all',
    access: text(form, 'access'),
    status: text(form, 'status'),
    featured: form.get('featured') === 'on',
    geo_allow: text(form, 'geo_allow').split(/[\s,]+/).filter(Boolean),
    poster_path: nullable(text(form, 'poster_path')),
    backdrop_path: nullable(text(form, 'backdrop_path')),
    asset_id: nullable(text(form, 'asset_id')),
    genre_ids: form.getAll('genre_ids').map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };

  const { genre_ids, ...row } = parsed.data;
  if (row.kind === 'series') row.asset_id = null;
  const res = id
    ? await db.from('titles').update(row).eq('id', id).select('id').single()
    : await db.from('titles').insert(row).select('id').single();
  if (res.error) return { error: res.error.code === '23505' ? 'Ce slug existe déjà.' : res.error.message };

  const titleId = res.data.id;
  await db.from('title_genres').delete().eq('title_id', titleId);
  if (genre_ids.length) await db.from('title_genres').insert(genre_ids.map((genre_id) => ({ title_id: titleId, genre_id })));

  revalidatePath('/[locale]', 'layout');
  if (!id) redirect(`/fr/admin/titles/${titleId}`);
  return { ok: true };
}

export async function deleteTitleAction(form: FormData) {
  const db = await adminDb();
  await db.from('titles').delete().eq('id', text(form, 'id'));
  revalidatePath('/[locale]', 'layout');
  redirect('/fr/admin/titles');
}

export async function saveSeasonAction(form: FormData) {
  const db = await adminDb();
  const parsed = seasonUpsertSchema.parse({ title_id: text(form, 'title_id'), number: text(form, 'number'), name: i18n(form, 'name') });
  await db.from('seasons').upsert(parsed, { onConflict: 'title_id,number' });
  revalidatePath(`/fr/admin/titles/${parsed.title_id}`);
}

export async function deleteSeasonAction(form: FormData) {
  const db = await adminDb();
  await db.from('seasons').delete().eq('id', text(form, 'id'));
  revalidatePath(`/fr/admin/titles/${text(form, 'title_id')}`);
}

export async function saveEpisodeAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const db = await adminDb();
  const id = nullable(text(form, 'id'));
  const parsed = episodeUpsertSchema.safeParse({
    season_id: text(form, 'season_id'),
    number: text(form, 'number'),
    name: i18n(form, 'name'),
    synopsis: i18n(form, 'synopsis'),
    access: nullable(text(form, 'access')),
    status: text(form, 'status'),
    asset_id: nullable(text(form, 'asset_id')),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ') };
  const res = id ? await db.from('episodes').update(parsed.data).eq('id', id) : await db.from('episodes').insert(parsed.data);
  if (res.error) return { error: res.error.code === '23505' ? 'Ce numéro d’épisode existe déjà dans la saison.' : res.error.message };
  revalidatePath(`/fr/admin/titles/${text(form, 'title_id')}`);
  return { ok: true };
}

export async function deleteEpisodeAction(form: FormData) {
  const db = await adminDb();
  await db.from('episodes').delete().eq('id', text(form, 'id'));
  revalidatePath(`/fr/admin/titles/${text(form, 'title_id')}`);
}
