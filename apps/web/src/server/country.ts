import 'server-only';

/**
 * Viewer country from the CDN geo header. The web app must only be reachable through Cloudflare
 * (Caddy restricts origin access to Cloudflare IPs), otherwise this header could be forged.
 */
export function countryFromHeaders(headers: Headers, fallback?: string): string | null {
  const raw = headers.get('cf-ipcountry') ?? headers.get('x-country-code');
  if (raw && /^[A-Z]{2}$/i.test(raw) && raw.toUpperCase() !== 'XX' && raw.toUpperCase() !== 'T1') {
    return raw.toUpperCase();
  }
  return fallback ?? null;
}
