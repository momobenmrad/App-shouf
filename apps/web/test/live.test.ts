import { verifySignedPath } from '@chouf/shared';
import { describe, expect, it } from 'vitest';
import { type LiveRepo, startLivePlayback } from '../src/server/live';

const SECRET = 'live-test-secret-0123456789abcdef-xyz';
const NOW = 1_800_000_000;
const CHANNEL = '30000000-0000-0000-0000-000000000001';
const EVENT = '50000000-0000-0000-0000-000000000001';
const license = { holder: 'TT', agreement_ref: 'A', expires_at: '2030-01-01', territories: ['TN', 'DZ'] };

function repo(overrides: Partial<LiveRepo> = {}): LiveRepo {
  return {
    getChannel: async (id) => (id === CHANNEL ? { id, status: 'active', access: 'free', active_source_id: 'src', license } : null),
    getEvent: async (id) => (id === EVENT ? { id, published: true, status: 'live', access: 'subscriber', geo_allow: [] } : null),
    getActivePlanStreams: async () => 2,
    openSession: async () => ({ id: 'session-1' }),
    ...overrides,
  };
}

const config = { liveBaseUrl: 'https://live.chouf.tn', signingSecret: SECRET, freeMaxStreams: 1, nowSeconds: NOW };
const base = { userId: 'u1', deviceId: 'device-123456', country: 'TN' };

describe('startLivePlayback', () => {
  it('signs a channel URL under the /c/ prefix', async () => {
    const res = await startLivePlayback(repo(), { ...base, channelId: CHANNEL }, config);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.kind).toBe('channel');
    expect(res.expiresAt).toBe(NOW + 6 * 3600);
    const verified = await verifySignedPath(new URL(res.url).pathname, SECRET, NOW);
    expect(verified).toMatchObject({ ok: true, scope: 'live', resourceId: CHANNEL, rest: 'index.m3u8' });
  });

  it('signs an event URL under the /e/ prefix', async () => {
    const res = await startLivePlayback(repo(), { ...base, eventId: EVENT }, config);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(await verifySignedPath(new URL(res.url).pathname, SECRET, NOW)).toMatchObject({ ok: true, scope: 'event', resourceId: EVENT });
  });

  it('enforces the licence territories of the channel source', async () => {
    expect(await startLivePlayback(repo(), { ...base, channelId: CHANNEL, country: 'FR' }, config)).toEqual({ ok: false, reason: 'geo_blocked' });
    expect(await startLivePlayback(repo(), { ...base, channelId: CHANNEL, country: null }, config)).toEqual({ ok: false, reason: 'geo_blocked' });
    expect((await startLivePlayback(repo(), { ...base, channelId: CHANNEL, country: 'dz' }, config)).ok).toBe(true);
  });

  it('reports offline channels and events that are not live', async () => {
    expect(await startLivePlayback(repo({ getChannel: async (id) => ({ id, status: 'active', access: 'free', active_source_id: null, license: null }) }), { ...base, channelId: CHANNEL }, config)).toEqual({ ok: false, reason: 'offline' });
    expect(await startLivePlayback(repo({ getEvent: async (id) => ({ id, published: true, status: 'scheduled', access: 'free', geo_allow: [] }) }), { ...base, eventId: EVENT }, config)).toEqual({ ok: false, reason: 'offline' });
    expect(await startLivePlayback(repo({ getEvent: async (id) => ({ id, published: false, status: 'live', access: 'free', geo_allow: [] }) }), { ...base, eventId: EVENT }, config)).toEqual({ ok: false, reason: 'not_found' });
  });

  it('applies subscription, auth and stream-limit rules', async () => {
    expect(await startLivePlayback(repo({ getActivePlanStreams: async () => null }), { ...base, eventId: EVENT }, config)).toEqual({ ok: false, reason: 'subscription_required' });
    expect(await startLivePlayback(repo(), { ...base, userId: null, channelId: CHANNEL }, config)).toEqual({ ok: false, reason: 'auth_required' });
    expect(await startLivePlayback(repo({ openSession: async () => 'too_many_streams' }), { ...base, channelId: CHANNEL }, config)).toEqual({ ok: false, reason: 'too_many_streams' });
  });
});
