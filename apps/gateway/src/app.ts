import { mediamtxAuthSchema, openUrl, rewritePlaylist, sealUrl, verifySignedPath } from '@chouf/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { type Resolver, TtlCache } from './resolver';

export interface GatewayDeps {
  resolver: Resolver;
  signingSecret: string;
  hookSecret: string;
  allowedOrigins: string[];
  /** Hostnames the gateway may proxy besides those found in licensed playlists (MediaMTX). */
  internalHosts: string[];
  endGraceMs: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
  onEventEnded?: (path: string) => void;
}

const SEGMENT_TTL_S = 10 * 60;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MIME: Record<string, string> = {
  m3u8: 'application/vnd.apple.mpegurl',
  ts: 'video/mp2t',
  m4s: 'video/iso.segment',
  mp4: 'video/mp4',
  aac: 'audio/aac',
  vtt: 'text/vtt',
  key: 'application/octet-stream',
};

/** Blocks link-local / loopback / private upstreams unless explicitly allowed (SSRF guard). */
export function isForbiddenUpstream(url: string, internalHosts: string[]): boolean {
  const host = new URL(url).hostname.replace(/^\[|\]$/g, '');
  if (internalHosts.includes(host)) return false;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return true;
  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd');
}

export function createGatewayApp(deps: GatewayDeps) {
  const now = deps.now ?? (() => Math.floor(Date.now() / 1000));
  const doFetch = deps.fetchImpl ?? fetch;
  const playlistCache = new TtlCache<{ status: number; text: string }>(1_000);
  const endTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const app = new Hono();

  const upstreamPlaylist = (url: string) =>
    playlistCache.get(url, async () => {
      const res = await doFetch(url, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), headers: { 'User-Agent': 'Chouf-Gateway/1.0' } });
      return { status: res.status, text: res.ok ? await res.text() : '' };
    });

  async function servePlaylist(scopePrefix: string, exp: number, sig: string, resourceId: string, upstreamUrl: string, method: string) {
    if (isForbiddenUpstream(upstreamUrl, deps.internalHosts)) return new Response('bad upstream', { status: 502 });
    const { status, text } = await upstreamPlaylist(upstreamUrl);
    if (status < 200 || status >= 300 || !text.startsWith('#EXTM3U')) return new Response('upstream unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
    const segExp = now() + SEGMENT_TTL_S;
    const tokenBase = `/${scopePrefix}/${exp}/${sig}/${resourceId}`;
    const sealed = new Map<string, Promise<string>>();
    const seal = (url: string, e: number) => {
      const k = `${e}|${url}`;
      let p = sealed.get(k);
      if (!p) sealed.set(k, (p = sealUrl(deps.signingSecret, url, e)));
      return p;
    };
    // Resolve all seals first (rewritePlaylist is synchronous).
    const pending: [string, Promise<string>][] = [];
    rewritePlaylist(text, upstreamUrl, (abs, kind) => {
      pending.push([abs + '|' + kind, kind === 'playlist' ? seal(abs, exp) : seal(abs, segExp)]);
      return '';
    });
    const resolved = new Map(await Promise.all(pending.map(async ([k, p]) => [k, await p] as const)));
    const body = rewritePlaylist(text, upstreamUrl, (abs, kind) => {
      const token = resolved.get(abs + '|' + kind)!;
      return kind === 'playlist' ? `${tokenBase}/v/${token}` : `/s/${token}`;
    });
    const headers = { 'Content-Type': MIME.m3u8!, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    return new Response(method === 'HEAD' ? null : body, { status: 200, headers });
  }

  app.use('*', cors({ origin: (o) => (deps.allowedOrigins.includes(o) ? o : null), allowMethods: ['GET', 'HEAD', 'OPTIONS'], maxAge: 86400 }));
  app.get('/health', (c) => c.json({ ok: true }));

  // Signed entry points: /c/{exp}/{sig}/{channelId}/index.m3u8 and /e/{exp}/{sig}/{eventId}/index.m3u8
  // plus variant playlists below them: .../v/{sealed}
  app.on(['GET', 'HEAD'], ['/c/*', '/e/*'], async (c) => {
    const result = await verifySignedPath(c.req.path, deps.signingSecret, now());
    if (!result.ok || result.scope === 'vod') return c.text(result.ok ? 'forbidden' : result.reason, 403, { 'Cache-Control': 'no-store' });
    const prefix = result.scope === 'live' ? 'c' : 'e';
    const rootUpstream = result.scope === 'live' ? await deps.resolver.channelUpstream(result.resourceId) : await deps.resolver.eventUpstream(result.resourceId);
    if (!rootUpstream) return c.text('offline', 404, { 'Cache-Control': 'no-store' });

    if (result.rest === 'index.m3u8') return servePlaylist(prefix, result.exp, c.req.path.split('/')[3]!, result.resourceId, rootUpstream, c.req.method);

    const variant = /^v\/([A-Za-z0-9_-]+)$/.exec(result.rest);
    if (variant) {
      const opened = await openUrl(deps.signingSecret, variant[1]!, now());
      if (!opened.ok) return c.text(opened.reason, 403, { 'Cache-Control': 'no-store' });
      return servePlaylist(prefix, result.exp, c.req.path.split('/')[3]!, result.resourceId, opened.url, c.req.method);
    }
    return c.text('not found', 404);
  });

  // Media segments / init sections / keys: same path for every viewer, cacheable at the CDN.
  app.on(['GET', 'HEAD'], '/s/:token', async (c) => {
    const opened = await openUrl(deps.signingSecret, c.req.param('token'), now());
    if (!opened.ok) return c.text(opened.reason, 403, { 'Cache-Control': 'no-store' });
    if (isForbiddenUpstream(opened.url, deps.internalHosts)) return c.text('bad upstream', 502);
    const upstream = await doFetch(opened.url, { method: c.req.method, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS), headers: { 'User-Agent': 'Chouf-Gateway/1.0' } });
    if (!upstream.ok) return c.text('upstream error', upstream.status === 404 ? 404 : 502, { 'Cache-Control': 'no-store' });
    const ext = new URL(opened.url).pathname.split('.').pop()?.toLowerCase() ?? '';
    const headers = new Headers({
      'Content-Type': MIME[ext] ?? upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=120',
      'X-Content-Type-Options': 'nosniff',
    });
    const len = upstream.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    return new Response(c.req.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
  });

  // MediaMTX hooks. The secret in the path is the only authentication MediaMTX can provide.
  const hooks = new Hono();
  hooks.use('*', async (c, next) => {
    if (c.req.param('secret') !== deps.hookSecret) return c.text('forbidden', 403);
    await next();
  });
  hooks.post('/auth', async (c) => {
    const parsed = mediamtxAuthSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.text('bad request', 400);
    const { action, path, password, query } = parsed.data;
    if (action === 'publish') {
      const key = password || new URLSearchParams(query).get('key') || '';
      if (!key || !/^live\//.test(path)) return c.text('unauthorized', 401);
      return (await deps.resolver.authorizePublish(path, key)) ? c.text('ok') : c.text('unauthorized', 401);
    }
    // HLS reads come from this gateway only (MediaMTX's HLS port is not exposed publicly).
    if (action === 'read' || action === 'playback') return c.text('ok');
    return c.text('unauthorized', 401);
  });
  hooks.post('/ready', async (c) => {
    const path = c.req.query('path') ?? '';
    if (!/^live\/[a-z0-9-]+$/.test(path)) return c.text('bad request', 400);
    const timer = endTimers.get(path);
    if (timer) {
      clearTimeout(timer);
      endTimers.delete(path);
    }
    await deps.resolver.streamReady(path);
    return c.text('ok');
  });
  hooks.post('/not-ready', (c) => {
    const path = c.req.query('path') ?? '';
    if (!/^live\/[a-z0-9-]+$/.test(path)) return c.text('bad request', 400);
    const existing = endTimers.get(path);
    if (existing) clearTimeout(existing);
    endTimers.set(
      path,
      setTimeout(() => {
        endTimers.delete(path);
        void deps.resolver.streamEnded(path).then(() => deps.onEventEnded?.(path));
      }, deps.endGraceMs),
    );
    return c.text('ok');
  });
  app.route('/hooks/mediamtx/:secret', hooks);

  app.notFound((c) => c.text('not found', 404));
  return app;
}
