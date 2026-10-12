import 'server-only';
import type { Database } from '@chouf/shared';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { env } from './env';

/** Supabase client acting as the signed-in user (RLS applies). One per request. */
export async function createUserClient() {
  const store = await cookies();
  return createServerClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, env().NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Privileged client (bypasses RLS). Server-side only, for writes that viewers must never make. */
export function createServiceClient() {
  return createClient<Database>(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type UserClient = Awaited<ReturnType<typeof createUserClient>>;
export type ServiceClient = ReturnType<typeof createServiceClient>;
