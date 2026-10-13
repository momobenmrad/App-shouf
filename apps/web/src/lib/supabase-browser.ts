import type { Database } from '@chouf/shared';
import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Browser client (anon key + user session cookie). URL/key are passed from the server at runtime. */
export function getBrowserSupabase(url: string, anonKey: string) {
  client ??= createBrowserClient<Database>(url, anonKey);
  return client;
}
