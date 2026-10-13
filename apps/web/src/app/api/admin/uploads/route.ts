import { UPLOAD_PART_BYTES, createUploadSchema, sourceKey } from '@chouf/shared';
import { requireAdminApi } from '@/server/admin-api';
import { json, jsonError, parseBody } from '@/server/http';
import { createMultipartUpload } from '@/server/s3';
import { createServiceClient } from '@/server/supabase';

/** Starts a direct-to-storage multipart upload and creates the media asset row. */
export async function POST(request: Request) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const body = await parseBody(request, createUploadSchema);
  if (!body.ok) return body.response;

  const db = createServiceClient();
  const assetId = crypto.randomUUID();
  const key = sourceKey(assetId, body.data.filename);
  const uploadId = await createMultipartUpload(key, body.data.contentType);
  const { error } = await db.from('media_assets').insert({
    id: assetId,
    original_filename: body.data.filename,
    content_type: body.data.contentType,
    size_bytes: body.data.size,
    source_key: key,
    upload_id: uploadId,
    status: 'uploading',
    created_by: admin.user.id,
  });
  if (error) return jsonError(500, 'db_error');
  return json({ assetId, partSize: UPLOAD_PART_BYTES }, 201);
}
