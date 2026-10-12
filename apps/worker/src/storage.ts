import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream, createWriteStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { WorkerConfig } from './config';

export interface Storage {
  download(key: string, file: string): Promise<void>;
  uploadFile(key: string, file: string, contentType: string, cacheControl: string): Promise<void>;
}

export function createS3Storage(config: WorkerConfig): Storage {
  const client = new S3Client({
    region: config.S3_REGION,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: { accessKeyId: config.S3_ACCESS_KEY_ID, secretAccessKey: config.S3_SECRET_ACCESS_KEY },
  });
  return {
    async download(key, file) {
      const res = await client.send(new GetObjectCommand({ Bucket: config.S3_BUCKET, Key: key }));
      if (!res.Body) throw new Error(`empty object ${key}`);
      await pipeline(res.Body as Readable, createWriteStream(file));
    },
    async uploadFile(key, file, contentType, cacheControl) {
      await new Upload({
        client,
        params: { Bucket: config.S3_BUCKET, Key: key, Body: createReadStream(file), ContentType: contentType, CacheControl: cacheControl },
      }).done();
    },
  };
}

const HLS_TYPES: Record<string, string> = { m3u8: 'application/vnd.apple.mpegurl', ts: 'video/mp2t', jpg: 'image/jpeg', vtt: 'text/vtt' };

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries.filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name));
}

/** Uploads every file of a local HLS directory under `prefix`, a few at a time. */
export async function uploadDirectory(storage: Storage, dir: string, prefix: string, concurrency = 8): Promise<number> {
  const files = await listFiles(dir);
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, async () => {
    while (index < files.length) {
      const file = files[index++]!;
      const rel = relative(dir, file).split('\\').join('/');
      const ext = rel.slice(rel.lastIndexOf('.') + 1);
      await storage.uploadFile(`${prefix}/${rel}`, file, HLS_TYPES[ext] ?? 'application/octet-stream', 'public, max-age=31536000, immutable');
    }
  });
  await Promise.all(workers);
  return files.length;
}
