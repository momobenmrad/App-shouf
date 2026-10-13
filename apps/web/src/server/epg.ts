import 'server-only';
import type { I18nText } from '@chouf/shared';
import type { UserClient } from './supabase';

export interface NowNext {
  now: { title: I18nText; start: string; end: string } | null;
  next: { title: I18nText; start: string } | null;
}

/** Now/next programme per active channel, keyed by channel id. */
export async function nowNextByChannel(db: UserClient): Promise<Map<string, NowNext>> {
  const { data } = await db.rpc('epg_now_next');
  const map = new Map<string, NowNext>();
  for (const row of data ?? []) {
    map.set(row.channel_id, {
      now: row.now_title && row.now_start && row.now_end ? { title: row.now_title, start: row.now_start, end: row.now_end } : null,
      next: row.next_title && row.next_start ? { title: row.next_title, start: row.next_start } : null,
    });
  }
  return map;
}

export interface GuideRow {
  channel: { id: string; slug: string; name: I18nText; logo_path: string | null };
  programmes: { title: I18nText; start: string; end: string; category: string | null }[];
}

/** Programmes of every active channel inside [from, to), for the grid. */
export async function guide(db: UserClient, from: Date, to: Date, kidsOnly: boolean): Promise<GuideRow[]> {
  let q = db.from('channels').select('id, slug, name, logo_path, category').eq('status', 'active').order('sort_order');
  if (kidsOnly) q = q.eq('category', 'kids');
  const { data: channels } = await q;
  if (!channels?.length) return [];
  const { data: programmes } = await db
    .from('epg_programs')
    .select('channel_id, title, start_at, end_at, category')
    .in('channel_id', channels.map((c) => c.id))
    .lt('start_at', to.toISOString())
    .gt('end_at', from.toISOString())
    .order('start_at');
  return channels.map((c) => ({
    channel: c,
    programmes: (programmes ?? []).filter((p) => p.channel_id === c.id).map((p) => ({ title: p.title, start: p.start_at, end: p.end_at, category: p.category })),
  }));
}
