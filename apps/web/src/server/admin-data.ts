import 'server-only';
import type { AssetOption } from '@/components/admin/TitleForm';
import type { UserClient } from './supabase';

export async function readyAssets(db: UserClient): Promise<AssetOption[]> {
  const { data } = await db.from('media_assets').select('id, original_filename, duration_seconds, height').eq('status', 'ready').order('created_at', { ascending: false }).limit(500);
  return (data ?? []).map((a) => ({
    id: a.id,
    label: `${a.original_filename} · ${a.height ?? '?'}p · ${Math.round((a.duration_seconds ?? 0) / 60)} min`,
  }));
}
