const KEY = 'chouf.device';

/** Stable per-browser id used to count concurrent streams (not a tracking identifier). */
export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && /^[A-Za-z0-9_-]{8,64}$/.test(existing)) return existing;
    const id = crypto.randomUUID().replace(/-/g, '');
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID().replace(/-/g, '');
  }
}
