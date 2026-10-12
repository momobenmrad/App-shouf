import { signPlaybackUrl } from '@chouf/shared';
import { describe, expect, it } from 'vitest';
import { createEdgeApp } from '../src/app';
import type { ObjectStore } from '../src/store';

const SECRET = 'edge-test-secret-0123456789abcdef';
const ASSET = '3f2b8c1e-1d2a-4c6b-9e7f-0a1b2c3d4e5f';
const NOW = 1_800_000_000;

const files: Record<string, string> = {
  [`hls/${ASSET}/master.m3u8`]: '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=900000\n360p/index.m3u8\n',
  [`hls/${ASSET}/360p/seg_0000.ts`]: 'TS-DATA',
  'artwork/poster-1.jpg': 'JPEG',
};

const store: ObjectStore = {
  async get(key) {
    const v = files[key];
    if (v === undefined) return null;
    const bytes = new TextEncoder().encode(v);
    return { body: new Blob([bytes]).stream(), size: bytes.length };
  },
};

const app = createEdgeApp({ store, signingSecret: SECRET, allowedOrigins: ['https://chouf.tn'], now: () => NOW });

async function signedPath(exp = NOW + 600) {
  const url = await signPlaybackUrl({ baseUrl: 'https://vod', secret: SECRET, scope: 'vod', resourceId: ASSET, exp, entry: 'master.m3u8' });
  return new URL(url).pathname;
}

describe('edge', () => {
  it('serves the manifest and segments below a valid token', async () => {
    const path = await signedPath();
    const manifest = await app.request(path);
    expect(manifest.status).toBe(200);
    expect(manifest.headers.get('Content-Type')).toBe('application/vnd.apple.mpegurl');
    expect(await manifest.text()).toContain('360p/index.m3u8');

    const seg = await app.request(path.replace('master.m3u8', '360p/seg_0000.ts'));
    expect(seg.status).toBe(200);
    expect(seg.headers.get('Content-Type')).toBe('video/mp2t');
    expect(seg.headers.get('Cache-Control')).toBe('private, max-age=600');
  });

  it('rejects expired and tampered tokens with 403', async () => {
    expect((await app.request(await signedPath(NOW - 10))).status).toBe(403);
    const tampered = (await signedPath()).replace(ASSET, '00000000-0000-0000-0000-000000000000');
    expect((await app.request(tampered)).status).toBe(403);
    expect((await app.request(`/t/${NOW + 60}/xxx/${ASSET}/master.m3u8`)).status).toBe(403);
  });

  it('returns 404 for missing files under a valid token', async () => {
    expect((await app.request((await signedPath()).replace('master.m3u8', '1080p/index.m3u8'))).status).toBe(404);
  });

  it('serves public artwork but never raw sources', async () => {
    expect((await app.request('/a/artwork/poster-1.jpg')).status).toBe(200);
    expect((await app.request('/a/sources/x/movie.mp4')).status).toBe(404);
    expect((await app.request(`/hls/${ASSET}/master.m3u8`)).status).toBe(404);
  });

  it('only allows CORS for Chouf origins', async () => {
    const path = await signedPath();
    const ok = await app.request(path, { headers: { Origin: 'https://chouf.tn' } });
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://chouf.tn');
    const evil = await app.request(path, { headers: { Origin: 'https://evil.example' } });
    expect(evil.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
