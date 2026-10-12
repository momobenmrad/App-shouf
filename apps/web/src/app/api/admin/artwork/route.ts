import { artworkKey, artworkUploadSchema } from '@chouf/shared';
import { requireAdminApi } from '@/server/admin-api';
import { json, parseBody } from '@/server/http';
import { presignPut } from '@/server/s3';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;

/** Presigned PUT for a poster/backdrop; the returned path is stored on the title. */
export async function POST(request: Request) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;
  const body = await parseBody(request, artworkUploadSchema);
  if (!body.ok) return body.response;
  const path = artworkKey(crypto.randomUUID(), EXT[body.data.contentType]);
  return json({ path, uploadUrl: await presignPut(path, body.data.contentType, body.data.size) });
}
