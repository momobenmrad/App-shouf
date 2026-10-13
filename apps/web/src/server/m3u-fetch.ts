// Downloads a playlist for the M3U import (e.g. a public iptv-org country list).
// Server-side fetch of an admin-supplied URL: https only, no private/loopback hosts, size and time capped.

export const MAX_PLAYLIST_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 15_000;

export type FetchPlaylistResult = { ok: true; text: string } | { ok: false; error: string };

/** Rejects hosts that would let the import reach the server's own network. */
export function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return true;
  const v4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd');
}

export async function fetchPlaylist(rawUrl: string, fetchImpl: typeof fetch = fetch): Promise<FetchPlaylistResult> {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return { ok: false, error: 'Adresse invalide.' };
  }
  if (url.protocol !== 'https:') return { ok: false, error: 'Seules les adresses https:// sont acceptées.' };
  if (isPrivateHost(url.hostname)) return { ok: false, error: 'Adresse interne refusée.' };

  let res: Response;
  try {
    res = await fetchImpl(url, { redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: 'audio/x-mpegurl, application/vnd.apple.mpegurl, text/plain, */*' } });
  } catch (err) {
    return { ok: false, error: `Téléchargement impossible : ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!res.ok) return { ok: false, error: `Téléchargement impossible (HTTP ${res.status}).` };
  if (res.url && isPrivateHost(new URL(res.url).hostname)) return { ok: false, error: 'Redirection vers une adresse interne refusée.' };
  const declared = Number(res.headers.get('content-length'));
  if (declared > MAX_PLAYLIST_BYTES) return { ok: false, error: 'Playlist trop volumineuse (2 Mo maximum).' };

  // Read with a hard cap even when content-length is absent or wrong.
  const reader = res.body?.getReader();
  if (!reader) return { ok: false, error: 'Réponse vide.' };
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PLAYLIST_BYTES) {
      await reader.cancel().catch(() => undefined);
      return { ok: false, error: 'Playlist trop volumineuse (2 Mo maximum).' };
    }
    chunks.push(value);
  }
  const text = new TextDecoder('utf-8').decode(Buffer.concat(chunks));
  if (!text.replace(/^﻿/, '').trimStart().startsWith('#EXTM3U')) return { ok: false, error: 'Ce n’est pas une playlist M3U (la première ligne doit être #EXTM3U).' };
  return { ok: true, text };
}
