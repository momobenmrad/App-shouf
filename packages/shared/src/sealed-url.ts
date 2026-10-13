// Opaque, expiring references to upstream URLs (AES-256-GCM, WebCrypto).
// Segment paths rewritten by the live gateway carry one of these: the same path for every viewer,
// so the CDN caches each segment once, while nobody can read or forge the upstream address.

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const keyCache = new Map<string, Promise<CryptoKey>>();

type CryptoKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>;

async function aesKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle
      .digest('SHA-256', encoder.encode(`chouf-sealed-url|${secret}`))
      .then((bits) => crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']));
    keyCache.set(secret, key);
  }
  return key;
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(value: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const bin = atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Seals `url` until `exp` (Unix seconds). Output is URL-safe. */
export async function sealUrl(secret: string, url: string, exp: number): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = encoder.encode(`${exp}|${url}`);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(secret), plain));
  const out = new Uint8Array(iv.length + cipher.length);
  out.set(iv);
  out.set(cipher, iv.length);
  return b64url(out);
}

export type OpenResult = { ok: true; url: string; exp: number } | { ok: false; reason: 'malformed' | 'expired' };

export async function openUrl(secret: string, token: string, nowSeconds: number): Promise<OpenResult> {
  const bytes = unb64url(token);
  if (!bytes || bytes.length < 12 + 16 + 1) return { ok: false, reason: 'malformed' };
  let plain: string;
  try {
    const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, await aesKey(secret), bytes.subarray(12));
    plain = decoder.decode(buf);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const sep = plain.indexOf('|');
  const exp = Number(plain.slice(0, sep));
  const url = plain.slice(sep + 1);
  if (sep < 1 || !Number.isFinite(exp) || !/^https?:\/\//.test(url)) return { ok: false, reason: 'malformed' };
  if (exp <= nowSeconds) return { ok: false, reason: 'expired' };
  return { ok: true, url, exp };
}
