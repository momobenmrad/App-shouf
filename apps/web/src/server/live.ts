import { type AccessLevel, type LicenseInfo, type PlaybackDenial, checkEntitlement, licenseAllowsTerritory, signPlaybackUrl } from '@chouf/shared';

export interface LiveRepo {
  getChannel(id: string): Promise<{ id: string; status: string; access: AccessLevel; active_source_id: string | null; license: LicenseInfo | null } | null>;
  getEvent(id: string): Promise<{ id: string; published: boolean; status: string; access: AccessLevel; geo_allow: string[] } | null>;
  getActivePlanStreams(userId: string): Promise<number | null>;
  openSession(input: { userId: string; channelId: string | null; eventId: string | null; deviceId: string; country: string | null; maxStreams: number }): Promise<{ id: string } | 'too_many_streams'>;
}

export interface StartLiveInput {
  userId: string | null;
  channelId?: string;
  eventId?: string;
  deviceId: string;
  country: string | null;
}

export interface LiveConfig {
  liveBaseUrl: string;
  signingSecret: string;
  freeMaxStreams: number;
  nowSeconds?: number;
}

/** Live tokens last 6 h; the player reloads the page to renew. */
export const LIVE_TOKEN_LIFETIME_S = 6 * 3600;

export type StartLiveResult =
  | { ok: true; url: string; sessionId: string; expiresAt: number; kind: 'channel' | 'event' }
  | { ok: false; reason: PlaybackDenial | 'offline' };

export async function startLivePlayback(repo: LiveRepo, input: StartLiveInput, config: LiveConfig): Promise<StartLiveResult> {
  if (!input.userId) return { ok: false, reason: 'auth_required' };

  let access: AccessLevel;
  let geoAllow: readonly string[];
  let resourceId: string;
  let kind: 'channel' | 'event';

  if (input.channelId) {
    const channel = await repo.getChannel(input.channelId);
    if (!channel) return { ok: false, reason: 'not_found' };
    if (channel.status !== 'active' || !channel.active_source_id || !channel.license) return { ok: false, reason: 'offline' };
    // A licensed feed may only be shown inside the territories of the agreement it comes from.
    if (!licenseAllowsTerritory(channel.license, input.country)) return { ok: false, reason: 'geo_blocked' };
    access = channel.access;
    geoAllow = [];
    resourceId = channel.id;
    kind = 'channel';
  } else if (input.eventId) {
    const event = await repo.getEvent(input.eventId);
    if (!event || !event.published) return { ok: false, reason: 'not_found' };
    if (event.status !== 'live') return { ok: false, reason: 'offline' };
    access = event.access;
    geoAllow = event.geo_allow;
    resourceId = event.id;
    kind = 'event';
  } else {
    return { ok: false, reason: 'not_found' };
  }

  const planStreams = await repo.getActivePlanStreams(input.userId);
  const entitlement = checkEntitlement({ access, geoAllow, country: input.country, isAuthenticated: true, hasActiveSubscription: planStreams !== null });
  if (!entitlement.ok) return entitlement;

  const session = await repo.openSession({
    userId: input.userId,
    channelId: kind === 'channel' ? resourceId : null,
    eventId: kind === 'event' ? resourceId : null,
    deviceId: input.deviceId,
    country: input.country,
    maxStreams: planStreams ?? config.freeMaxStreams,
  });
  if (session === 'too_many_streams') return { ok: false, reason: 'too_many_streams' };

  const expiresAt = (config.nowSeconds ?? Math.floor(Date.now() / 1000)) + LIVE_TOKEN_LIFETIME_S;
  const url = await signPlaybackUrl({ baseUrl: config.liveBaseUrl, secret: config.signingSecret, scope: kind === 'channel' ? 'live' : 'event', resourceId, exp: expiresAt, entry: 'index.m3u8' });
  return { ok: true, url, sessionId: session.id, expiresAt, kind };
}
