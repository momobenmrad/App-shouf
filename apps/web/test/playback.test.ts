import { verifySignedPath } from '@chouf/shared';
import { describe, expect, it } from 'vitest';
import { type PlaybackRepo, resumePosition, startPlayback, tokenLifetimeSeconds } from '../src/server/playback';

const SECRET = 'playback-test-secret-0123456789abcdef';
const NOW = 1_800_000_000;
const MOVIE = '11111111-1111-4111-8111-111111111111';
const SERIES = '22222222-2222-4222-8222-222222222222';
const EPISODE = '33333333-3333-4333-8333-333333333333';
const ASSET = '44444444-4444-4444-8444-444444444444';

function repo(overrides: Partial<PlaybackRepo> = {}, state = { sessions: 0 }): PlaybackRepo {
  return {
    getTitle: async (id) =>
      id === MOVIE
        ? { id, kind: 'movie', status: 'published', access: 'subscriber', geo_allow: ['TN', 'DZ'], asset_id: ASSET }
        : id === SERIES
          ? { id, kind: 'series', status: 'published', access: 'subscriber', geo_allow: [], asset_id: null }
          : null,
    getEpisode: async (id) => (id === EPISODE ? { id, status: 'published', access: 'free', asset_id: ASSET, title_id: SERIES } : null),
    getAsset: async () => ({ id: ASSET, status: 'ready', duration_seconds: 5400 }),
    getActivePlanStreams: async () => 2,
    openSession: async ({ maxStreams }) => (state.sessions++ < maxStreams ? { id: `session-${state.sessions}` } : 'too_many_streams'),
    getProgress: async () => ({ position_seconds: 1200, completed: false }),
    ...overrides,
  };
}

const config = { vodBaseUrl: 'https://vod.chouf.tn', signingSecret: SECRET, freeMaxStreams: 1, nowSeconds: NOW };
const input = { userId: 'u1', titleId: MOVIE, deviceId: 'device-123456', country: 'TN' };

describe('startPlayback', () => {
  it('returns a signed URL valid for the asset and the resume position', async () => {
    const res = await startPlayback(repo(), input, config);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.resumeAt).toBe(1200);
    expect(res.expiresAt).toBe(NOW + 5400 + 7200);
    const verified = await verifySignedPath(new URL(res.url).pathname, SECRET, NOW);
    expect(verified).toMatchObject({ ok: true, resourceId: ASSET, rest: 'master.m3u8' });
  });

  it('denies anonymous users, non-subscribers and foreign countries', async () => {
    expect(await startPlayback(repo(), { ...input, userId: null }, config)).toEqual({ ok: false, reason: 'auth_required' });
    expect(await startPlayback(repo({ getActivePlanStreams: async () => null }), input, config)).toEqual({ ok: false, reason: 'subscription_required' });
    expect(await startPlayback(repo(), { ...input, country: 'FR' }, config)).toEqual({ ok: false, reason: 'geo_blocked' });
  });

  it('uses the episode access level and asset for series', async () => {
    const res = await startPlayback(repo({ getActivePlanStreams: async () => null }), { ...input, titleId: SERIES, episodeId: EPISODE }, config);
    expect(res.ok).toBe(true);
  });

  it('rejects an episode that belongs to another series', async () => {
    const r = repo({ getEpisode: async () => ({ id: EPISODE, status: 'published', access: null, asset_id: ASSET, title_id: MOVIE }) });
    expect(await startPlayback(r, { ...input, titleId: SERIES, episodeId: EPISODE }, config)).toEqual({ ok: false, reason: 'not_found' });
  });

  it('enforces the concurrent stream limit of the plan', async () => {
    const state = { sessions: 0 };
    const r = repo({}, state);
    expect((await startPlayback(r, input, config)).ok).toBe(true);
    expect((await startPlayback(r, input, config)).ok).toBe(true);
    expect(await startPlayback(r, input, config)).toEqual({ ok: false, reason: 'too_many_streams' });
  });

  it('refuses assets that are not ready', async () => {
    expect(await startPlayback(repo({ getAsset: async () => ({ id: ASSET, status: 'processing', duration_seconds: null }) }), input, config)).toEqual({ ok: false, reason: 'not_ready' });
  });
});

describe('helpers', () => {
  it('caps token lifetime at 12 hours', () => {
    expect(tokenLifetimeSeconds(20 * 3600)).toBe(12 * 3600);
    expect(tokenLifetimeSeconds(null)).toBe(5 * 3600);
  });
  it('skips resume near the start, near the credits or when completed', () => {
    expect(resumePosition({ position_seconds: 5, completed: false }, 3600)).toBe(0);
    expect(resumePosition({ position_seconds: 3590, completed: false }, 3600)).toBe(0);
    expect(resumePosition({ position_seconds: 600, completed: true }, 3600)).toBe(0);
    expect(resumePosition({ position_seconds: 600, completed: false }, 3600)).toBe(600);
  });
});
