import { describe, expect, it, vi } from 'vitest';
import { MAX_PLAYLIST_BYTES, fetchPlaylist, isPrivateHost } from '../src/server/m3u-fetch';

const PLAYLIST = '#EXTM3U\n#EXTINF:-1 tvg-id="ElWatania1.tn@SD",El Watania 1 (1080p)\nhttps://example.org/w1.m3u8\n';

const respond = (body: string | Uint8Array<ArrayBuffer>, init: ResponseInit & { url?: string } = {}) =>
  vi.fn(async () => {
    const res = new Response(body, init);
    if (init.url) Object.defineProperty(res, 'url', { value: init.url });
    return res;
  }) as unknown as typeof fetch;

describe('fetchPlaylist', () => {
  it('downloads an https playlist', async () => {
    const f = respond(PLAYLIST, { status: 200 });
    expect(await fetchPlaylist(' https://iptv-org.github.io/iptv/countries/tn.m3u ', f)).toEqual({ ok: true, text: PLAYLIST });
  });

  it('refuses non-https, private hosts and internal redirects', async () => {
    const f = respond(PLAYLIST);
    expect(await fetchPlaylist('http://example.org/a.m3u', f)).toMatchObject({ ok: false, error: expect.stringContaining('https') });
    expect(await fetchPlaylist('https://127.0.0.1/a.m3u', f)).toMatchObject({ ok: false, error: 'Adresse interne refusée.' });
    expect(await fetchPlaylist('https://169.254.169.254/latest', f)).toMatchObject({ ok: false });
    expect(await fetchPlaylist('pas une url', f)).toMatchObject({ ok: false, error: 'Adresse invalide.' });
    expect(f).not.toHaveBeenCalled();
    expect(await fetchPlaylist('https://example.org/a.m3u', respond(PLAYLIST, { url: 'https://10.0.0.2/a.m3u' }))).toMatchObject({ ok: false, error: expect.stringContaining('Redirection') });
  });

  it('rejects HTTP errors, non-playlists and oversized bodies', async () => {
    expect(await fetchPlaylist('https://example.org/a.m3u', respond('nope', { status: 404 }))).toMatchObject({ ok: false, error: expect.stringContaining('404') });
    expect(await fetchPlaylist('https://example.org/a.m3u', respond('<html>'))).toMatchObject({ ok: false, error: expect.stringContaining('#EXTM3U') });
    const big = new Uint8Array(MAX_PLAYLIST_BYTES + 10).fill(0x41);
    expect(await fetchPlaylist('https://example.org/a.m3u', respond(big))).toMatchObject({ ok: false, error: expect.stringContaining('volumineuse') });
  });

  it('flags private hostnames', () => {
    for (const h of ['localhost', 'db.internal', '192.168.1.4', '[::1]', 'fd00::1']) expect(isPrivateHost(h)).toBe(true);
    for (const h of ['iptv-org.github.io', '8.8.8.8']) expect(isPrivateHost(h)).toBe(false);
  });
});
