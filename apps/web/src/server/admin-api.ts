import 'server-only';
import type { User } from '@supabase/supabase-js';
import { env } from './env';
import { isSameOrigin, jsonError } from './http';
import { createUserClient } from './supabase';

/** Guards admin route handlers: same origin, signed in, and role = admin (checked in the DB). */
export async function requireAdminApi(request: Request): Promise<{ ok: true; user: User } | { ok: false; response: Response }> {
  if (!isSameOrigin(request, env().APP_URL)) return { ok: false, response: jsonError(403, 'cross_origin') };
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, response: jsonError(401, 'auth_required') };
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return { ok: false, response: jsonError(403, 'forbidden') };
  return { ok: true, user };
}
