/** What the gateway needs to know about channels and events; implemented on Supabase, faked in tests. */
export interface Resolver {
  /** Upstream playlist URL of the channel's active source, or null when the channel is off. */
  channelUpstream(channelId: string): Promise<string | null>;
  /** Upstream (MediaMTX) playlist URL of a live, published event, or null. */
  eventUpstream(eventId: string): Promise<string | null>;
  authorizePublish(path: string, key: string): Promise<boolean>;
  streamReady(path: string): Promise<void>;
  /** Called once the disconnect grace period has elapsed. */
  streamEnded(path: string): Promise<void>;
}

/** Tiny TTL cache with in-flight de-duplication. */
export class TtlCache<V> {
  private readonly entries = new Map<string, { value: Promise<V>; expires: number }>();
  constructor(private readonly ttlMs: number, private readonly now: () => number = Date.now) {}

  get(key: string, load: () => Promise<V>): Promise<V> {
    const hit = this.entries.get(key);
    if (hit && hit.expires > this.now()) return hit.value;
    const value = load().catch((err) => {
      this.entries.delete(key);
      throw err;
    });
    this.entries.set(key, { value, expires: this.now() + this.ttlMs });
    if (this.entries.size > 10_000) this.entries.clear();
    return value;
  }

  invalidate(key: string) {
    this.entries.delete(key);
  }
}
