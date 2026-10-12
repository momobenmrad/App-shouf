// Node entry for local development and self-hosting: reads objects from any S3-compatible store.
import { GetObjectCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { serve } from '@hono/node-server';
import { Readable } from 'node:stream';
import { createEdgeApp } from './app';
import type { ObjectStore } from './store';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing env ${name}`);
  return value;
}

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'auto',
  endpoint: required('S3_ENDPOINT'),
  forcePathStyle: true,
  credentials: { accessKeyId: required('S3_ACCESS_KEY_ID'), secretAccessKey: required('S3_SECRET_ACCESS_KEY') },
});
const bucket = required('S3_BUCKET');

const store: ObjectStore = {
  async get(key) {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      if (!res.Body) return null;
      return {
        body: Readable.toWeb(res.Body as Readable) as ReadableStream<Uint8Array>,
        size: res.ContentLength,
        etag: res.ETag,
      };
    } catch (err) {
      if (err instanceof NoSuchKey || (err as { name?: string }).name === 'NoSuchKey') return null;
      throw err;
    }
  },
};

const app = createEdgeApp({
  store,
  signingSecret: required('PLAYBACK_SIGNING_SECRET'),
  allowedOrigins: (process.env.EDGE_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
});

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`chouf-edge listening on :${port}`));
