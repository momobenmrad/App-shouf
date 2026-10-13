import 'server-only';
import type { ProfileRow } from '@chouf/shared';
import type { User } from '@supabase/supabase-js';
import { createUserClient } from './supabase';

export interface Viewer {
  user: User;
  profile: ProfileRow;
}

/** Current user + profile, or null. Validates the JWT with Supabase Auth (not just the cookie). */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return profile ? { user, profile } : null;
}

export async function getAdmin(): Promise<Viewer | null> {
  const viewer = await getViewer();
  return viewer?.profile.role === 'admin' ? viewer : null;
}
