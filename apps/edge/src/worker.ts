// Cloudflare Worker entry: R2 binding + edge cache keyed on the object, not the token, so every
// viewer of the same segment shares one cached copy.
import { createEdgeApp } from './app';
import type { ObjectStore } from './store';

interface Env {
  BUCKET: R2Bucket;
  SIGNING_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const CACHE_ORIGIN = 'https://edge-cache.chouf.internal/';

function r2Store(bucket: R2Bucket, ctx: ExecutionContext): ObjectStore {
  const cache = (caches as unknown as { default: Cache }).default;
  return {
    async get(key) {
      const cacheKey = new Request(CACHE_ORIGIN + key);
      const hit = await cache.match(cacheKey);
      if (hit?.body) {
        const size = hit.headers.get('Content-Length');
        return { body: hit.body, size: size ? Number(size) : undefined, etag: hit.headers.get('ETag') ?? undefined };
      }
      const object = await bucket.get(key);
      if (!object) return null;
      const [forClient, forCache] = object.body.tee();
      ctx.waitUntil(
        cache.put(
          cacheKey,
          new Response(forCache, {
            headers: { 'Content-Length': String(object.size), ETag: object.httpEtag, 'Cache-Control': 'public, max-age=2592000' },
          }),
        ),
      );
      return { body: forClient, size: object.size, etag: object.httpEtag };
    },
  };
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const app = createEdgeApp({
      store: r2Store(env.BUCKET, ctx),
      signingSecret: env.SIGNING_SECRET,
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
    });
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
