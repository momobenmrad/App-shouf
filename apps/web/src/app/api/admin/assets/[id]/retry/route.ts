import { requireAdminApi } from '@/server/admin-api';
import { json, jsonError } from '@/server/http';
import { enqueueTranscode } from '@/server/queue';
import { createServiceClient } from '@/server/supabase';

/** Re-queues a failed transcode. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const { id } = await params;
  const db = createServiceClient();
  const { data: asset } = await db.from('media_assets').select('id, status').eq('id', id).maybeSingle();
  if (!asset || asset.status !== 'failed') return jsonError(409, 'not_failed');
  const { count } = await db.from('transcode_jobs').select('id', { count: 'exact', head: true }).eq('asset_id', id);
  await db.from('media_assets').update({ status: 'queued', error: null, progress: 0 }).eq('id', id);
  await enqueueTranscode(id, count ?? Date.now());
  return json({ ok: true });
}
