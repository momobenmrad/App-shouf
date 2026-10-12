import type { Database } from '@chouf/shared';
import { createServerClient } from '@supabase/ssr';
import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const handleI18n = createIntlMiddleware(routing);
const PROTECTED = /^\/(ar|fr|en)\/(admin|account|watch)(\/|$)/;

/** Locale routing + Supabase session refresh + sign-in gate for private pages. */
export default async function proxy(request: NextRequest) {
  const response = handleI18n(request);

  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const match = PROTECTED.exec(request.nextUrl.pathname);
  if (match && !user) {
    const login = new URL(`/${match[1]}/login`, request.url);
    login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
