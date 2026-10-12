import type { AccessLevel } from './database.types';

export type PlaybackDenial =
  | 'not_found'
  | 'not_ready'
  | 'auth_required'
  | 'subscription_required'
  | 'geo_blocked'
  | 'too_many_streams';

export const DENIAL_HTTP_STATUS: Record<PlaybackDenial, number> = {
  not_found: 404,
  not_ready: 425,
  auth_required: 401,
  subscription_required: 402,
  geo_blocked: 451,
  too_many_streams: 409,
};

export interface EntitlementInput {
  /** Access level of the title, or of the episode when it overrides the title. */
  access: AccessLevel;
  /** ISO country codes allowed; empty = everywhere. */
  geoAllow: readonly string[];
  /** Viewer's country (from the CDN header), null when unknown. */
  country: string | null;
  isAuthenticated: boolean;
  hasActiveSubscription: boolean;
}

export type EntitlementResult = { ok: true } | { ok: false; reason: PlaybackDenial };

export function effectiveAccess(titleAccess: AccessLevel, episodeAccess: AccessLevel | null | undefined): AccessLevel {
  return episodeAccess ?? titleAccess;
}

/** Territory check that fails closed: an unknown country is refused when a restriction exists. */
export function isTerritoryAllowed(allowed: readonly string[], country: string | null): boolean {
  if (allowed.length === 0) return true;
  return country !== null && allowed.includes(country.toUpperCase());
}

export function checkEntitlement(input: EntitlementInput): EntitlementResult {
  if (!input.isAuthenticated) return { ok: false, reason: 'auth_required' };
  if (!isTerritoryAllowed(input.geoAllow, input.country)) return { ok: false, reason: 'geo_blocked' };
  if (input.access === 'subscriber' && !input.hasActiveSubscription) {
    return { ok: false, reason: 'subscription_required' };
  }
  return { ok: true };
}

export function isSubscriptionActive(
  sub: { status: string; current_period_end: string | null } | null | undefined,
  now: Date = new Date(),
): boolean {
  return !!sub && sub.status === 'active' && !!sub.current_period_end && new Date(sub.current_period_end) > now;
}
