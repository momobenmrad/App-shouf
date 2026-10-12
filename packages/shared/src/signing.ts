// Signed, time-limited playback URLs. The token lives in the path:
//   {base}/t/{exp}/{sig}/{resourceId}/master.m3u8   (VOD)
//   {base}/c/{exp}/{sig}/{resourceId}/index.m3u8    (live channel, Phase 2)
// HLS players resolve variant playlists and segments relative to the manifest URL, so every
// request below the manifest carries the token without rewriting playlists.
// Uses WebCrypto only, so the same code runs in Node, Next.js and Cloudflare Workers.

export type TokenScope = 'vod' | 'live';

const SCOPE_PREFIX: Record<TokenScope, string> = { vod: 't', live: 'c' };
const encoder = new TextEncoder();
type HmacKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;
const keyCache = new Map<string, Promise<HmacKey>>();

function hmacKey(secret: string): Promise<HmacKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
      'verify',
    ]);
    keyCache.set(secret, key);
  }
  return key;
}

function payload(scope: TokenScope, resourceId: string, exp: number): Uint8Array<ArrayBuffer> {
  return encoder.encode(`v1|${scope}|${resourceId}|${exp}`);
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export async function signToken(secret: string, scope: TokenScope, resourceId: string, exp: number): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), payload(scope, resourceId, exp));
  return toBase64Url(new Uint8Array(sig));
}

export interface SignUrlInput {
  baseUrl: string;
  secret: string;
  scope: TokenScope;
  resourceId: string;
  /** Expiry as a Unix timestamp in seconds. */
  exp: number;
  /** Entry file below the resource, e.g. "master.m3u8". */
  entry: string;
}

export async function signPlaybackUrl(input: SignUrlInput): Promise<string> {
  const sig = await signToken(input.secret, input.scope, input.resourceId, input.exp);
  const base = input.baseUrl.replace(/\/+$/, '');
  return `${base}/${SCOPE_PREFIX[input.scope]}/${input.exp}/${sig}/${input.resourceId}/${input.entry}`;
}

export type VerifyResult =
  | { ok: true; scope: TokenScope; resourceId: string; exp: number; rest: string }
  | { ok: false; reason: 'malformed' | 'expired' | 'bad_signature' };

const PATH_RE = /^\/(t|c)\/(\d{1,12})\/([A-Za-z0-9_-]{43})\/([0-9a-f-]{36})\/(.+)$/;

/**
 * Verifies a signed path. `rest` is the path below the resource id (e.g. "720p/seg_0001.ts");
 * it never contains ".." segments when ok is true.
 */
export async function verifySignedPath(path: string, secret: string, nowSeconds: number): Promise<VerifyResult> {
  const m = PATH_RE.exec(path);
  if (!m) return { ok: false, reason: 'malformed' };
  const [, prefix, expRaw, sigRaw, resourceId, rest] = m as unknown as [string, string, string, string, string, string];
  if (rest.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) {
    return { ok: false, reason: 'malformed' };
  }
  const scope: TokenScope = prefix === 't' ? 'vod' : 'live';
  const exp = Number(expRaw);
  if (exp <= nowSeconds) return { ok: false, reason: 'expired' };
  const sig = fromBase64Url(sigRaw);
  if (!sig) return { ok: false, reason: 'malformed' };
  // crypto.subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), sig, payload(scope, resourceId, exp));
  if (!valid) return { ok: false, reason: 'bad_signature' };
  return { ok: true, scope, resourceId, exp, rest };
}
