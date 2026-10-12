import { describe, expect, it } from 'vitest';
import { firstVariantUrl, inspectMediaPlaylist, isMasterPlaylist, rewritePlaylist } from '../src/hls';
import { openUrl, sealUrl } from '../src/sealed-url';

const MASTER = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="ar",URI="audio/ar.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
https://cdn.example.net/live/720p/index.m3u8
`;

const MEDIA = `#EXTM3U
#EXT-X-TARGETDURATION:6
#EXT-X-MEDIA-SEQUENCE:1042
#EXT-X-MAP:URI="init.mp4"
#EXT-X-KEY:METHOD=AES-128,URI="https://keys.example.net/k1",IV=0x1
#EXTINF:6.000,
seg1042.m4s
#EXTINF:5.960,
seg1043.m4s
`;

const map = (url: string, kind: string) => `${kind}:${url}`;

describe('rewritePlaylist', () => {
  it('rewrites variant and alternate rendition URIs of a master playlist', () => {
    const out = rewritePlaylist(MASTER, 'https://origin.example.org/live/master.m3u8', map);
    expect(out).toContain('URI="playlist:https://origin.example.org/live/audio/ar.m3u8"');
    expect(out).toContain('\nplaylist:https://origin.example.org/live/360p/index.m3u8\n');
    expect(out).toContain('\nplaylist:https://cdn.example.net/live/720p/index.m3u8\n');
    expect(out).toContain('#EXT-X-STREAM-INF:BANDWIDTH=1200000,RESOLUTION=640x360');
  });

  it('rewrites segments, init sections and keys of a media playlist', () => {
    const out = rewritePlaylist(MEDIA, 'https://origin.example.org/live/360p/index.m3u8', map);
    expect(out).toContain('#EXT-X-MAP:URI="segment:https://origin.example.org/live/360p/init.mp4"');
    expect(out).toContain('URI="other:https://keys.example.net/k1",IV=0x1');
    expect(out).toContain('\nsegment:https://origin.example.org/live/360p/seg1042.m4s\n');
    expect(out).not.toContain('\nseg1043.m4s');
    expect(out).toContain('#EXTINF:5.960,');
  });

  it('never leaks an upstream URL', () => {
    const out = rewritePlaylist(MASTER + MEDIA, 'https://origin.example.org/x/y.m3u8', () => '/opaque');
    expect(out).not.toMatch(/origin\.example|cdn\.example|keys\.example/);
  });
});

describe('inspection helpers', () => {
  it('detects master playlists and picks the first variant', () => {
    expect(isMasterPlaylist(MASTER)).toBe(true);
    expect(isMasterPlaylist(MEDIA)).toBe(false);
    expect(firstVariantUrl(MASTER, 'https://o.example/live/m.m3u8')).toBe('https://o.example/live/360p/index.m3u8');
    expect(firstVariantUrl(MEDIA, 'https://o.example/')).toBeNull();
  });

  it('extracts sequence, target duration and last segment', () => {
    expect(inspectMediaPlaylist(MEDIA, 'https://o.example/live/360p/index.m3u8')).toEqual({
      mediaSequence: 1042,
      targetDuration: 6,
      segmentCount: 2,
      lastSegmentUrl: 'https://o.example/live/360p/seg1043.m4s',
      lastSegmentDuration: 5.96,
      ended: false,
    });
    expect(inspectMediaPlaylist(MEDIA + '#EXT-X-ENDLIST\n', 'https://o.example/').ended).toBe(true);
  });
});

describe('sealed URLs', () => {
  const SECRET = 'seal-test-secret-0123456789abcdef';
  const NOW = 1_800_000_000;

  it('round-trips and is URL safe', async () => {
    const token = await sealUrl(SECRET, 'https://origin.example.org/live/seg1.ts?x=1', NOW + 60);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await openUrl(SECRET, token, NOW)).toEqual({ ok: true, url: 'https://origin.example.org/live/seg1.ts?x=1', exp: NOW + 60 });
  });

  it('refuses expired, tampered and foreign tokens', async () => {
    const token = await sealUrl(SECRET, 'https://origin.example.org/seg.ts', NOW + 60);
    expect(await openUrl(SECRET, token, NOW + 61)).toEqual({ ok: false, reason: 'expired' });
    expect((await openUrl(SECRET, token.slice(0, -2) + 'AA', NOW)).ok).toBe(false);
    expect((await openUrl('other-secret', token, NOW)).ok).toBe(false);
    expect(await openUrl(SECRET, 'not-a-token', NOW)).toEqual({ ok: false, reason: 'malformed' });
  });

  it('produces a different token each time (random IV) that still opens', async () => {
    const a = await sealUrl(SECRET, 'https://o.example/s', NOW + 5);
    const b = await sealUrl(SECRET, 'https://o.example/s', NOW + 5);
    expect(a).not.toBe(b);
    expect((await openUrl(SECRET, b, NOW)).ok).toBe(true);
  });
});
