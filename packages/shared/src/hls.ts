// HLS playlist parsing and rewriting for the live gateway.
// Upstream playlists (licensed channels, MediaMTX) are fetched server-side and every URI they
// contain is replaced by an opaque local path, so viewers never learn the upstream address.

export type UriKind = 'playlist' | 'segment' | 'other';

const URI_ATTR_RE = /URI="([^"]*)"/g;

/** Tags whose URI attribute points at another playlist. */
const PLAYLIST_TAGS = ['#EXT-X-MEDIA:', '#EXT-X-I-FRAME-STREAM-INF:'];
/** Tags whose URI attribute points at media data. */
const SEGMENT_TAGS = ['#EXT-X-MAP:', '#EXT-X-PART:', '#EXT-X-PRELOAD-HINT:'];

export function isMasterPlaylist(text: string): boolean {
  return text.includes('#EXT-X-STREAM-INF:');
}

/**
 * Rewrites every URI of a playlist through `map`. URIs are resolved against `baseUrl` first, so
 * the callback always receives absolute upstream URLs. Unknown tags are passed through untouched.
 */
export function rewritePlaylist(text: string, baseUrl: string, map: (absoluteUrl: string, kind: UriKind) => string): string {
  const master = isMasterPlaylist(text);
  const resolve = (uri: string) => new URL(uri, baseUrl).toString();
  const out: string[] = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('#')) {
      const kind: UriKind | null = PLAYLIST_TAGS.some((t) => line.startsWith(t))
        ? 'playlist'
        : SEGMENT_TAGS.some((t) => line.startsWith(t))
          ? 'segment'
          : line.startsWith('#EXT-X-KEY:') || line.startsWith('#EXT-X-SESSION-KEY:') || line.startsWith('#EXT-X-RENDITION-REPORT:')
            ? 'other'
            : null;
      out.push(kind ? line.replace(URI_ATTR_RE, (_m, uri: string) => `URI="${map(resolve(uri), kind)}"`) : line);
    } else if (line.trim() === '') {
      out.push(line);
    } else {
      out.push(map(resolve(line.trim()), master ? 'playlist' : 'segment'));
    }
  }
  return out.join('\n');
}

export interface MediaPlaylistInfo {
  mediaSequence: number;
  targetDuration: number;
  segmentCount: number;
  lastSegmentUrl: string | null;
  lastSegmentDuration: number | null;
  ended: boolean;
}

/** Facts the monitor needs from a media playlist. */
export function inspectMediaPlaylist(text: string, baseUrl: string): MediaPlaylistInfo {
  let mediaSequence = 0;
  let targetDuration = 0;
  let segmentCount = 0;
  let lastSegmentUrl: string | null = null;
  let lastSegmentDuration: number | null = null;
  let pendingDuration: number | null = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) mediaSequence = Number(line.slice(22)) || 0;
    else if (line.startsWith('#EXT-X-TARGETDURATION:')) targetDuration = Number(line.slice(22)) || 0;
    else if (line.startsWith('#EXTINF:')) pendingDuration = Number.parseFloat(line.slice(8)) || null;
    else if (line && !line.startsWith('#')) {
      segmentCount++;
      lastSegmentUrl = new URL(line, baseUrl).toString();
      lastSegmentDuration = pendingDuration;
      pendingDuration = null;
    }
  }
  return { mediaSequence, targetDuration, segmentCount, lastSegmentUrl, lastSegmentDuration, ended: text.includes('#EXT-X-ENDLIST') };
}

/** First variant of a master playlist (or null): the monitor probes a single rendition. */
export function firstVariantUrl(text: string, baseUrl: string): string | null {
  const lines = text.split('\n').map((l) => l.trim());
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.startsWith('#EXT-X-STREAM-INF:')) {
      const uri = lines.slice(i + 1).find((l) => l && !l.startsWith('#'));
      if (uri) return new URL(uri, baseUrl).toString();
    }
  }
  return null;
}
