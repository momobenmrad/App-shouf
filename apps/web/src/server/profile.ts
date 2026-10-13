import 'server-only';
import { type MaturityRating, type ViewerProfileRow, allowedRatings } from '@chouf/shared';
import { cookies } from 'next/headers';
import type { Viewer } from './auth';
import { createUserClient } from './supabase';

export const PROFILE_COOKIE = 'chouf_profile';
const UUID = /^[0-9a-f-]{36}$/;

/**
 * Active viewer profile: the one named by the cookie when it belongs to the signed-in user,
 * otherwise the account's default profile. Null when signed out.
 */
export async function getActiveProfile(viewer: Viewer | null): Promise<ViewerProfileRow | null> {
  if (!viewer) return null;
  const db = await createUserClient();
  const { data: profiles } = await db.from('viewer_profiles').select('*').eq('user_id', viewer.user.id).order('created_at');
  if (!profiles?.length) return null;
  const wanted = (await cookies()).get(PROFILE_COOKIE)?.value;
  return (wanted && UUID.test(wanted) && profiles.find((p) => p.id === wanted)) || profiles.find((p) => p.is_default) || profiles[0]!;
}

/** Catalog visibility for a profile: every rating for adults, a capped list for kids profiles. */
export function visibleRatings(profile: ViewerProfileRow | null): MaturityRating[] {
  return allowedRatings(profile?.maturity_max ?? '18+');
}

export function profileCookieOptions(): { httpOnly: boolean; sameSite: 'lax'; path: string; maxAge: number; secure: boolean } {
  return { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 365 * 86400, secure: process.env.NODE_ENV === 'production' };
}
