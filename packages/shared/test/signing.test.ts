import { describe, expect, it } from 'vitest';
import { signPlaybackUrl, verifySignedPath } from '../src/signing';

const SECRET = 'test-secret-with-enough-entropy-0123456789';
const ASSET = '3f2b8c1e-1d2a-4c6b-9e7f-0a1b2c3d4e5f';
const NOW = 1_800_000_000;

async function signed(exp = NOW + 3600) {
  const url = await signPlaybackUrl({
    baseUrl: 'https://vod.chouf.tn/',
    secret: SECRET,
    scope: 'vod',
    resourceId: ASSET,
    exp,
    entry: 'master.m3u8',
  });
  return new URL(url).pathname;
}

describe('signed playback paths', () => {
  it('builds a path-embedded token', async () => {
    expect(await signed()).toMatch(new RegExp(`^/t/${NOW + 3600}/[A-Za-z0-9_-]{43}/${ASSET}/master.m3u8$`));
  });

  it('accepts the manifest and any file below the same asset', async () => {
    const path = await signed();
    const base = path.replace(/master\.m3u8$/, '');
    expect(await verifySignedPath(path, SECRET, NOW)).toMatchObject({ ok: true, resourceId: ASSET, rest: 'master.m3u8' });
    expect(await verifySignedPath(`${base}720p/seg_0001.ts`, SECRET, NOW)).toMatchObject({
      ok: true,
      rest: '720p/seg_0001.ts',
    });
  });

  it('rejects expired tokens', async () => {
    expect(await verifySignedPath(await signed(NOW - 1), SECRET, NOW)).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a token reused for another asset', async () => {
    const path = (await signed()).replace(ASSET, '00000000-0000-0000-0000-000000000000');
    expect(await verifySignedPath(path, SECRET, NOW)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects an extended expiry', async () => {
    const path = (await signed()).replace(`/t/${NOW + 3600}/`, `/t/${NOW + 999_999}/`);
    expect(await verifySignedPath(path, SECRET, NOW)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects another secret, path traversal and junk', async () => {
    const path = await signed();
    expect((await verifySignedPath(path, 'other-secret', NOW)).ok).toBe(false);
    expect(await verifySignedPath(path.replace('master.m3u8', '../x/master.m3u8'), SECRET, NOW)).toEqual({
      ok: false,
      reason: 'malformed',
    });
    expect(await verifySignedPath('/t/abc/def/ghi/master.m3u8', SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('does not accept a VOD token on the live prefix', async () => {
    const path = (await signed()).replace(/^\/t\//, '/c/');
    expect(await verifySignedPath(path, SECRET, NOW)).toEqual({ ok: false, reason: 'bad_signature' });
  });
});
