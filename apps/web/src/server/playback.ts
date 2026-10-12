import {
  type AccessLevel,
  type PlaybackDenial,
  checkEntitlement,
  effectiveAccess,
  signPlaybackUrl,
} from '@chouf/shared';

/** Data access needed to start playback; implemented with the service client, faked in tests. */
export interface PlaybackRepo {
  getTitle(id: string): Promise<{ id: string; kind: 'movie' | 'series'; status: string; access: AccessLevel; geo_allow: string[]; asset_id: string | null } | null>;
  getEpisode(id: string): Promise<{ id: string; status: string; access: AccessLevel | null; asset_id: string | null; title_id: string } | null>;
  getAsset(id: string): Promise<{ id: string; status: string; duration_seconds: number | null } | null>;
  /** Active subscription's max_streams, or null when the user has no active subscription. */
  getActivePlanStreams(userId: string): Promise<number | null>;
  openSession(input: { userId: string; assetId: string; deviceId: string; country: string | null; maxStreams: number }): Promise<{ id: string } | 'too_many_streams'>;
  getProgress(userId: string, assetId: string): Promise<{ position_seconds: number; completed: boolean } | null>;
}

export interface StartPlaybackInput {
  userId: string | null;
  titleId: string;
  episodeId?: string;
  deviceId: string;
  country: string | null;
}

export interface PlaybackConfig {
  vodBaseUrl: string;
  signingSecret: string;
  freeMaxStreams: number;
  nowSeconds?: number;
}

export type StartPlaybackResult =
  | { ok: true; url: string; sessionId: string; resumeAt: number; expiresAt: number; durationSeconds: number | null }
  | { ok: false; reason: PlaybackDenial };

/** Token lifetime: the whole film plus a margin for pauses, capped at 12 h. */
export function tokenLifetimeSeconds(durationSeconds: number | null): number {
  return Math.min((durationSeconds ?? 3 * 3600) + 2 * 3600, 12 * 3600);
}

/** Resume point: ignore the first 10 s and the last 30 s (credits) or finished items. */
export function resumePosition(progress: { position_seconds: number; completed: boolean } | null, durationSeconds: number | null): number {
  if (!progress || progress.completed || progress.position_seconds < 10) return 0;
  if (durationSeconds && progress.position_seconds > durationSeconds - 30) return 0;
  return progress.position_seconds;
}

export async function startPlayback(repo: PlaybackRepo, input: StartPlaybackInput, config: PlaybackConfig): Promise<StartPlaybackResult> {
  if (!input.userId) return { ok: false, reason: 'auth_required' };

  const title = await repo.getTitle(input.titleId);
  if (!title || title.status !== 'published') return { ok: false, reason: 'not_found' };

  let access = title.access;
  let assetId = title.asset_id;
  if (title.kind === 'series') {
    if (!input.episodeId) return { ok: false, reason: 'not_found' };
    const episode = await repo.getEpisode(input.episodeId);
    if (!episode || episode.title_id !== title.id || episode.status !== 'published') return { ok: false, reason: 'not_found' };
    access = effectiveAccess(title.access, episode.access);
    assetId = episode.asset_id;
  }
  if (!assetId) return { ok: false, reason: 'not_ready' };

  const asset = await repo.getAsset(assetId);
  if (!asset || asset.status !== 'ready') return { ok: false, reason: 'not_ready' };

  const planStreams = await repo.getActivePlanStreams(input.userId);
  const entitlement = checkEntitlement({
    access,
    geoAllow: title.geo_allow,
    country: input.country,
    isAuthenticated: true,
    hasActiveSubscription: planStreams !== null,
  });
  if (!entitlement.ok) return entitlement;

  const session = await repo.openSession({
    userId: input.userId,
    assetId,
    deviceId: input.deviceId,
    country: input.country,
    maxStreams: planStreams ?? config.freeMaxStreams,
  });
  if (session === 'too_many_streams') return { ok: false, reason: 'too_many_streams' };

  const now = config.nowSeconds ?? Math.floor(Date.now() / 1000);
  const expiresAt = now + tokenLifetimeSeconds(asset.duration_seconds);
  const url = await signPlaybackUrl({
    baseUrl: config.vodBaseUrl,
    secret: config.signingSecret,
    scope: 'vod',
    resourceId: assetId,
    exp: expiresAt,
    entry: 'master.m3u8',
  });
  const progress = await repo.getProgress(input.userId, assetId);
  return {
    ok: true,
    url,
    sessionId: session.id,
    resumeAt: resumePosition(progress, asset.duration_seconds),
    expiresAt,
    durationSeconds: asset.duration_seconds,
  };
}
