import 'server-only';
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

let internal: S3Client | undefined;
let publicClient: S3Client | undefined;

function client(kind: 'internal' | 'public'): S3Client {
  const e = env();
  const make = (endpoint: string) =>
    new S3Client({
      region: e.S3_REGION,
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: e.S3_ACCESS_KEY_ID, secretAccessKey: e.S3_SECRET_ACCESS_KEY },
    });
  if (kind === 'internal') return (internal ??= make(e.S3_ENDPOINT));
  return (publicClient ??= make(e.S3_PUBLIC_ENDPOINT ?? e.S3_ENDPOINT));
}

const PRESIGN_TTL = 15 * 60;

export async function createMultipartUpload(key: string, contentType: string): Promise<string> {
  const res = await client('internal').send(new CreateMultipartUploadCommand({ Bucket: env().S3_BUCKET, Key: key, ContentType: contentType }));
  if (!res.UploadId) throw new Error('no UploadId returned');
  return res.UploadId;
}

export async function presignParts(key: string, uploadId: string, partNumbers: number[]): Promise<Record<number, string>> {
  const entries = await Promise.all(
    partNumbers.map(async (n) => {
      const url = await getSignedUrl(
        client('public'),
        new UploadPartCommand({ Bucket: env().S3_BUCKET, Key: key, UploadId: uploadId, PartNumber: n }),
        { expiresIn: PRESIGN_TTL },
      );
      return [n, url] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export async function listUploadedParts(key: string, uploadId: string): Promise<{ partNumber: number; etag: string; size: number }[]> {
  const parts: { partNumber: number; etag: string; size: number }[] = [];
  let marker: string | undefined;
  do {
    const res = await client('internal').send(
      new ListPartsCommand({ Bucket: env().S3_BUCKET, Key: key, UploadId: uploadId, PartNumberMarker: marker }),
    );
    for (const p of res.Parts ?? []) {
      if (p.PartNumber && p.ETag) parts.push({ partNumber: p.PartNumber, etag: p.ETag, size: p.Size ?? 0 });
    }
    marker = res.IsTruncated ? res.NextPartNumberMarker : undefined;
  } while (marker);
  return parts;
}

export async function completeMultipartUpload(key: string, uploadId: string, parts: { partNumber: number; etag: string }[]) {
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  await client('internal').send(
    new CompleteMultipartUploadCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sorted.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })) },
    }),
  );
}

export async function presignPut(key: string, contentType: string, contentLength: number): Promise<string> {
  return getSignedUrl(
    client('public'),
    new PutObjectCommand({ Bucket: env().S3_BUCKET, Key: key, ContentType: contentType, ContentLength: contentLength, CacheControl: 'public, max-age=31536000, immutable' }),
    { expiresIn: PRESIGN_TTL },
  );
}
