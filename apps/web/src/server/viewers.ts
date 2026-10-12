import 'server-only';
import Redis from 'ioredis';
import { env } from './env';

const WINDOW_S = 30;
const g = globalThis as unknown as { viewersRedis?: Redis };

function redis(): Redis {
  g.viewersRedis ??= new Redis(env().REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 2, enableOfflineQueue: false });
  return g.viewersRedis;
}

const key = (kind: 'channel' | 'event', id: string) => `viewers:${kind}:${id}`;

/** Records a heartbeat; viewers are sessions seen in the last 30 s. */
export async function recordViewer(kind: 'channel' | 'event', id: string, sessionId: string): Promise<void> {
  try {
    const r = redis();
    const now = Date.now();
    await r.multi().zadd(key(kind, id), now, sessionId).zremrangebyscore(key(kind, id), 0, now - WINDOW_S * 1000).expire(key(kind, id), WINDOW_S * 2).exec();
  } catch {
    // Viewer counting is best-effort.
  }
}

export async function countViewers(kind: 'channel' | 'event', id: string): Promise<number> {
  try {
    const now = Date.now();
    return await redis().zcount(key(kind, id), now - WINDOW_S * 1000, '+inf');
  } catch {
    return 0;
  }
}
