import { verifySignedPath } from '@chouf/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { type ObjectStore, contentTypeFor } from './store';

export interface EdgeConfig {
  store: ObjectStore;
  signingSecret: string;
  allowedOrigins: string[];
  now?: () => number;
}

const ARTWORK_RE = /^\/a\/(artwork\/[A-Za-z0-9/_-]+\.(?:jpg|jpeg|png|webp))$/;

export function createEdgeApp(config: EdgeConfig) {
  const now = config.now ?? (() => Math.floor(Date.now() / 1000));
  const app = new Hono();

  app.use(
    '*',
    cors({
      origin: (origin) => (config.allowedOrigins.includes(origin) ? origin : null),
      allowMethods: ['GET', 'HEAD', 'OPTIONS'],
      maxAge: 86400,
    }),
  );

  app.get('/health', (c) => c.json({ ok: true }));

  // Signed VOD: /t/{exp}/{sig}/{assetId}/{file...}
  app.on(['GET', 'HEAD'], '/t/*', async (c) => {
    const result = await verifySignedPath(c.req.path, config.signingSecret, now());
    if (!result.ok || result.scope !== 'vod') {
      return c.text(result.ok ? 'forbidden' : result.reason, 403, { 'Cache-Control': 'no-store' });
    }
    const object = await config.store.get(`hls/${result.resourceId}/${result.rest}`);
    if (!object) return c.text('not found', 404, { 'Cache-Control': 'no-store' });
    const ttl = Math.max(0, result.exp - now());
    return respond(c.req.method, object, contentTypeFor(result.rest), `private, max-age=${Math.min(ttl, 86400)}`);
  });

  // Public artwork (posters, backdrops): /a/artwork/...
  app.on(['GET', 'HEAD'], '/a/*', async (c) => {
    const m = ARTWORK_RE.exec(c.req.path);
    if (!m) return c.text('not found', 404);
    const object = await config.store.get(m[1]!);
    if (!object) return c.text('not found', 404);
    return respond(c.req.method, object, contentTypeFor(m[1]!), 'public, max-age=604800, immutable');
  });

  app.notFound((c) => c.text('not found', 404));
  return app;
}

function respond(method: string, object: { body: ReadableStream; size?: number; etag?: string }, type: string, cache: string) {
  const headers = new Headers({ 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' });
  if (object.size !== undefined) headers.set('Content-Length', String(object.size));
  if (object.etag) headers.set('ETag', object.etag);
  if (method === 'HEAD') {
    void object.body.cancel();
    return new Response(null, { status: 200, headers });
  }
  return new Response(object.body, { status: 200, headers });
}
