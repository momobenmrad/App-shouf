'use server';

import { KIDS_MAX_RATING, MATURITY_ORDER, type MaturityRating, isLocale } from '@chouf/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getViewer } from '../auth';
import { PROFILE_COOKIE, profileCookieOptions } from '../profile';
import { createUserClient } from '../supabase';
import type { ActionState } from './admin';

const localeOf = (form: FormData) => {
  const l = String(form.get('locale') ?? 'ar');
  return isLocale(l) ? l : 'ar';
};

function safeNext(next: unknown, locale: string): string {
  return typeof next === 'string' && next.startsWith(`/${locale}/`) && !next.startsWith('//') ? next : `/${locale}`;
}

export async function switchProfileAction(form: FormData) {
  const viewer = await getViewer();
  const locale = localeOf(form);
  if (!viewer) redirect(`/${locale}/login`);
  const id = String(form.get('id'));
  const db = await createUserClient();
  const { data } = await db.from('viewer_profiles').select('id').eq('id', id).eq('user_id', viewer.user.id).maybeSingle();
  if (!data) redirect(`/${locale}/profiles`);
  (await cookies()).set(PROFILE_COOKIE, data.id, profileCookieOptions());
  redirect(safeNext(form.get('next'), locale));
}

const profileSchema = z.object({
  name: z.string().trim().min(1).max(30),
  avatar: z.string().trim().min(1).max(8),
  color: z.coerce.number().int().min(0).max(359),
  is_kids: z.boolean(),
  maturity_max: z.enum(MATURITY_ORDER as unknown as [MaturityRating, ...MaturityRating[]]),
});

export async function saveProfileAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: 'auth' };
  const id = typeof form.get('id') === 'string' && form.get('id') !== '' ? String(form.get('id')) : null;
  const parsed = profileSchema.safeParse({
    name: form.get('name'),
    avatar: form.get('avatar') || '🙂',
    color: form.get('color') ?? 0,
    is_kids: form.get('is_kids') === 'on',
    maturity_max: form.get('is_kids') === 'on' ? KIDS_MAX_RATING : (form.get('maturity_max') ?? '18+'),
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' · ') };
  const db = await createUserClient();
  const res = id
    ? await db.from('viewer_profiles').update(parsed.data).eq('id', id).eq('user_id', viewer.user.id)
    : await db.from('viewer_profiles').insert({ ...parsed.data, user_id: viewer.user.id });
  if (res.error) return { error: res.error.code === 'CH003' ? 'limit' : res.error.message };
  redirect(`/${localeOf(form)}/profiles`);
}

export async function deleteProfileAction(form: FormData) {
  const viewer = await getViewer();
  const locale = localeOf(form);
  if (!viewer) redirect(`/${locale}/login`);
  const id = String(form.get('id'));
  const db = await createUserClient();
  // The default profile cannot be removed; it is where the account's history lives.
  await db.from('viewer_profiles').delete().eq('id', id).eq('user_id', viewer.user.id).eq('is_default', false);
  const store = await cookies();
  if (store.get(PROFILE_COOKIE)?.value === id) store.delete(PROFILE_COOKIE);
  redirect(`/${locale}/profiles`);
}
