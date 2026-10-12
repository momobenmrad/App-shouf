import { signPlaybackUrl } from '@chouf/shared';
import { describe, expect, it, vi } from 'vitest';
import { createGatewayApp, isForbiddenUpstream } from '../src/app';
import type { Resolver } from '../src/resolver';

const SECRET = 'gateway-test-secret-0123456789abcdef';
const HOOK = 'hook-secret-0123456789';
const CHANNEL = '30000000-0000-0000-0000-000000000001';
const EVENT = '50000000-0000-0000-0000-000000000001';
const NOW = 1_800_000_000;

const upstream: Record<string, string> = {
  'https://origin.example.net/watania/master.m3u8': '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000\n360p/index.m3u8\n',
  'https://origin.example.net/watania/360p/index.m3u8': '#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:7\n#EXTINF:6.0,\nseg7.ts\n',
  'https://origin.example.net/watania/360p/seg7.ts': 'TSDATA',
  'http://mediamtx:8888/live/finale/index.m3u8': '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3000000\nstream.m3u8\n',
};

const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  const body = upstream[url];
  if (body === undefined) return new Response('nope', { status: 404 });
  return new Response(init?.method === 'HEAD' ? null : body, { status: 200, headers: { 'content-type': 'application/octet-stream' } });
}) as unknown as typeof fetch;

function makeApp(overrides: Partial<Resolver> = {}, state = { ready: [] as string[], ended: [] as string[] }) {
  const resolver: Resolver = {
    channelUpstream: async (id) => (id === CHANNEL ? 'https://origin.example.net/watania/master.m3u8' : null),
    eventUpstream: async (id) => (id === EVENT ? 'http://mediamtx:8888/live/finale/index.m3u8' : null),
    authorizePublish: async (path, key) => path === 'live/finale' && key === 'k-finale',
    streamReady: async (p) => void state.ready.push(p),
    streamEnded: async (p) => void state.ended.push(p),
    ...overrides,
  };
  const app = createGatewayApp({ resolver, signingSecret: SECRET, hookSecret: HOOK, allowedOrigins: ['https://chouf.tn'], internalHosts: ['mediamtx'], endGraceMs: 20, fetchImpl, now: () => NOW });
  return { app, state };
}

const signed = (scope: 'live' | 'event', id: string, exp = NOW + 3600) =>
  signPlaybackUrl({ baseUrl: 'https://live', secret: SECRET, scope, resourceId: id, exp, entry: 'index.m3u8' }).then((u) => new URL(u).pathname);

describe('live gateway', () => {
  it('serves a rewritten master playlist, variant playlist and segment without exposing the upstream', async () => {
    const { app } = makeApp();
    const path = await signed('live', CHANNEL);
    const master = await app.request(path);
    expect(master.status).toBe(200);
    expect(master.headers.get('Content-Type')).toBe('application/vnd.apple.mpegurl');
    const masterText = await master.text();
    expect(masterText).not.toContain('origin.example.net');
    const variantPath = masterText.split('\n').find((l) => l.startsWith('/c/'))!;
    expect(variantPath).toMatch(new RegExp(`^/c/${NOW + 3600}/[A-Za-z0-9_-]{43}/${CHANNEL}/v/[A-Za-z0-9_-]+$`));

    const variant = await app.request(variantPath);
    expect(variant.status).toBe(200);
    const variantText = await variant.text();
    expect(variantText).toContain('#EXT-X-MEDIA-SEQUENCE:7');
    const segPath = variantText.split('\n').find((l) => l.startsWith('/s/'))!;
    expect(segPath).toBeDefined();

    const seg = await app.request(segPath);
    expect(seg.status).toBe(200);
    expect(seg.headers.get('Content-Type')).toBe('video/mp2t');
    expect(seg.headers.get('Cache-Control')).toBe('public, max-age=120');
    expect(await seg.text()).toBe('TSDATA');
  });

  it('rejects invalid, expired and VOD tokens, and offline channels', async () => {
    const { app } = makeApp();
    expect((await app.request(await signed('live', CHANNEL, NOW - 1))).status).toBe(403);
    expect((await app.request((await signed('live', CHANNEL)).replace(CHANNEL, EVENT))).status).toBe(403);
    expect((await app.request(`/t/${NOW + 60}/${'a'.repeat(43)}/${CHANNEL}/index.m3u8`)).status).toBe(404); // VOD paths do not exist here
    const { app: off } = makeApp({ channelUpstream: async () => null });
    expect((await off.request(await signed('live', CHANNEL))).status).toBe(404);
  });

  it('serves own-ingest events from MediaMTX under the /e/ prefix', async () => {
    const { app } = makeApp();
    const res = await app.request(await signed('event', EVENT));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/\/e\/\d+\/[A-Za-z0-9_-]{43}\/50000000-0000-0000-0000-000000000001\/v\//);
  });

  it('returns 503 when the upstream playlist is unavailable', async () => {
    const { app } = makeApp({ channelUpstream: async () => 'https://origin.example.net/missing.m3u8' });
    const res = await app.request(await signed('live', CHANNEL));
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('refuses sealed segment tokens that are forged or expired', async () => {
    const { app } = makeApp();
    expect((await app.request('/s/forged-token')).status).toBe(403);
  });

  it('authenticates MediaMTX publishers through the hook', async () => {
    const { app } = makeApp();
    const post = (body: unknown, secret = HOOK) =>
      app.request(`/hooks/mediamtx/${secret}/auth`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    expect((await post({ action: 'publish', path: 'live/finale', password: 'k-finale' })).status).toBe(200);
    expect((await post({ action: 'publish', path: 'live/finale', query: 'key=k-finale' })).status).toBe(200);
    expect((await post({ action: 'publish', path: 'live/finale', password: 'wrong' })).status).toBe(401);
    expect((await post({ action: 'publish', path: 'other', password: 'k-finale' })).status).toBe(401);
    expect((await post({ action: 'read', path: 'live/finale' })).status).toBe(200);
    expect((await post({ action: 'api' })).status).toBe(401);
    expect((await post({ action: 'publish', path: 'live/finale', password: 'k-finale' }, 'bad-secret')).status).toBe(403);
  });

  it('marks streams ready and ends them after the grace period unless they come back', async () => {
    const { app, state } = makeApp();
    expect((await app.request(`/hooks/mediamtx/${HOOK}/ready?path=live/finale`, { method: 'POST' })).status).toBe(200);
    expect(state.ready).toEqual(['live/finale']);

    await app.request(`/hooks/mediamtx/${HOOK}/not-ready?path=live/finale`, { method: 'POST' });
    await app.request(`/hooks/mediamtx/${HOOK}/ready?path=live/finale`, { method: 'POST' });
    await new Promise((r) => setTimeout(r, 40));
    expect(state.ended).toEqual([]);

    await app.request(`/hooks/mediamtx/${HOOK}/not-ready?path=live/finale`, { method: 'POST' });
    await new Promise((r) => setTimeout(r, 40));
    expect(state.ended).toEqual(['live/finale']);
    expect((await app.request(`/hooks/mediamtx/${HOOK}/ready?path=../etc`, { method: 'POST' })).status).toBe(400);
  });
});

describe('isForbiddenUpstream', () => {
  it('blocks private and loopback hosts except the allowed internal ones', () => {
    expect(isForbiddenUpstream('http://169.254.169.254/latest', [])).toBe(true);
    expect(isForbiddenUpstream('http://10.0.0.5/x.m3u8', [])).toBe(true);
    expect(isForbiddenUpstream('http://localhost:8888/x', [])).toBe(true);
    expect(isForbiddenUpstream('http://mediamtx:8888/x', ['mediamtx'])).toBe(false);
    expect(isForbiddenUpstream('https://cdn.example.net/x.m3u8', [])).toBe(false);
  });
});
