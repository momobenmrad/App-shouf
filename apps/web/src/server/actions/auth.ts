'use server';

import { isLocale } from '@chouf/shared';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { env } from '../env';
import { createUserClient } from '../supabase';

const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
  locale: z.string().refine(isLocale),
  next: z.string().optional(),
});

function safeNext(next: string | undefined, locale: string): string {
  return next && next.startsWith(`/${locale}/`) && !next.startsWith('//') ? next : `/${locale}`;
}

export async function signInAction(form: FormData) {
  const parsed = credentials.safeParse(Object.fromEntries(form));
  const locale = parsed.success ? parsed.data.locale : 'ar';
  if (!parsed.success) redirect(`/${locale}/login?error=invalid`);
  const supabase = await createUserClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    const next = parsed.data.next ? `&next=${encodeURIComponent(parsed.data.next)}` : '';
    redirect(`/${locale}/login?error=invalid${next}`);
  }
  redirect(safeNext(parsed.data.next, locale));
}

export async function signUpAction(form: FormData) {
  const parsed = credentials
    .extend({ displayName: z.string().trim().max(80).optional() })
    .safeParse(Object.fromEntries(form));
  const locale = parsed.success ? parsed.data.locale : 'ar';
  if (!parsed.success) redirect(`/${locale}/signup?error=${encodeURIComponent('invalid')}`);
  const supabase = await createUserClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName, locale },
      emailRedirectTo: `${env().APP_URL}/api/auth/callback?next=/${locale}`,
    },
  });
  if (error) redirect(`/${locale}/signup?error=${encodeURIComponent(error.message)}`);
  // With e-mail confirmation enabled there is no session yet.
  if (!data.session) redirect(`/${locale}/login?notice=check-email`);
  redirect(`/${locale}`);
}

export async function signOutAction(form: FormData) {
  const locale = String(form.get('locale') ?? 'ar');
  const supabase = await createUserClient();
  await supabase.auth.signOut();
  redirect(`/${isLocale(locale) ? locale : 'ar'}`);
}

export async function updateLocaleAction(form: FormData) {
  const locale = String(form.get('locale'));
  if (!isLocale(locale)) return;
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  await supabase.from('profiles').update({ locale }).eq('id', user.id);
  redirect(`/${locale}/account`);
}
