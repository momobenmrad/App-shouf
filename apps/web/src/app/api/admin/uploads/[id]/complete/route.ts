import { completeUploadSchema } from '@chouf/shared';
import { requireAdminApi } from '@/server/admin-api';
import { json, jsonError, parseBody } from '@/server/http';
import { enqueueTranscode } from '@/server/queue';
import { completeMultipartUpload } from '@/server/s3';
import { createServiceClient } from '@/server/supabase';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const body = await parseBody(request, completeUploadSchema);
  if (!body.ok) return body.response;

  const { id } = await params;
  const db = createServiceClient();
  const { data: asset } = await db.from('media_assets').select('id, source_key, upload_id, status').eq('id', id).maybeSingle();
  if (!asset?.upload_id || asset.status !== 'uploading') return jsonError(404, 'upload_not_found');

  await completeMultipartUpload(asset.source_key, asset.upload_id, body.data.parts);
  await db.from('media_assets').update({ status: 'queued', upload_id: null, progress: 0 }).eq('id', id);
  await enqueueTranscode(id);
  return json({ assetId: id, status: 'queued' });
}
