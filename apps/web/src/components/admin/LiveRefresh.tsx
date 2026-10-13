'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase-browser';

/** Re-renders the server page whenever the monitor or the gateway updates these tables. */
export function LiveRefresh({ tables, supabaseUrl, supabaseAnonKey }: { tables: string[]; supabaseUrl: string; supabaseAnonKey: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = getBrowserSupabase(supabaseUrl, supabaseAnonKey);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel = supabase.channel(`admin-refresh-${tables.join('-')}`);
    for (const table of tables) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 500);
      });
    }
    channel.subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [tables, supabaseUrl, supabaseAnonKey, router]);
  return null;
}
