import { presignPartsSchema } from '@chouf/shared';
import { requireAdminApi } from '@/server/admin-api';
import { json, jsonError, parseBody } from '@/server/http';
import { listUploadedParts, presignParts } from '@/server/s3';
import { createServiceClient } from '@/server/supabase';

type Params = { params: Promise<{ id: string }> };

async function loadUpload(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data } = await createServiceClient().from('media_assets').select('source_key, upload_id, status').eq('id', id).maybeSingle();
  return data?.upload_id && data.status === 'uploading' ? { key: data.source_key, uploadId: data.upload_id } : null;
}

/** Parts already stored — lets the uploader resume after a reload or a network loss. */
export async function GET(request: Request, { params }: Params) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const upload = await loadUpload((await params).id);
  if (!upload) return jsonError(404, 'upload_not_found');
  return json({ parts: await listUploadedParts(upload.key, upload.uploadId) });
}

/** Presigned PUT URLs (15 min) for a batch of parts. */
export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const body = await parseBody(request, presignPartsSchema);
  if (!body.ok) return body.response;
  const upload = await loadUpload((await params).id);
  if (!upload) return jsonError(404, 'upload_not_found');
  return json({ urls: await presignParts(upload.key, upload.uploadId, body.data.partNumbers) });
}
