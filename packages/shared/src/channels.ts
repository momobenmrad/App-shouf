// Licensed channel sources: health hysteresis, licence checks and active-source selection.
// Pure functions so the Phase 2 monitor worker and the admin UI share the exact same rules.
import type { ChannelSourceRow, LicenseInfo, SourceHealth } from './database.types';

export const HEALTH_RULES = {
  /** Consecutive failed checks before a source is considered down. */
  downAfterFailures: 3,
  /** Consecutive successful checks before a down source is healthy again. */
  healthyAfterSuccesses: 5,
} as const;

export interface HealthState {
  health: SourceHealth;
  consecutive_failures: number;
  consecutive_successes: number;
}

export interface CheckOutcome {
  ok: boolean;
  /** Reachable but too slow / stalled playlist. */
  degraded?: boolean;
}

export function nextHealth(state: HealthState, check: CheckOutcome): HealthState {
  if (!check.ok) {
    const failures = state.consecutive_failures + 1;
    const health: SourceHealth =
      failures >= HEALTH_RULES.downAfterFailures ? 'down' : state.health === 'down' ? 'down' : 'degraded';
    return { health, consecutive_failures: failures, consecutive_successes: 0 };
  }
  const successes = state.consecutive_successes + 1;
  let health: SourceHealth;
  if (state.health === 'down' && successes < HEALTH_RULES.healthyAfterSuccesses) health = 'down';
  else health = check.degraded ? 'degraded' : 'healthy';
  return { health, consecutive_failures: 0, consecutive_successes: successes };
}

/** today = 'YYYY-MM-DD' (UTC). A licence is valid through its expiry day. */
export function isLicenseActive(license: LicenseInfo, today: string): boolean {
  return today <= license.expires_at;
}

export function daysUntilExpiry(license: LicenseInfo, today: string): number {
  const ms = Date.parse(`${license.expires_at}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export function licenseAllowsTerritory(license: LicenseInfo, country: string | null): boolean {
  return country !== null && license.territories.includes(country.toUpperCase());
}

export type SourceCandidate = Pick<ChannelSourceRow, 'id' | 'priority' | 'enabled' | 'health' | 'license_info'>;

export type SourceChange = 'failover' | 'failback' | 'restored' | 'all_sources_down' | null;

export interface SourceDecision {
  activeSourceId: string | null;
  change: SourceChange;
}

/**
 * Chooses the source a channel should serve.
 * - Only enabled sources with a valid licence are candidates.
 * - A healthy source with a better priority than the current one wins (failback), so returning
 *   to the primary waits for HEALTH_RULES.healthyAfterSuccesses good checks.
 * - The current source is kept while it is not down.
 * - Otherwise the best non-down source is used (failover), even if its health is still unknown.
 */
export function decideActiveSource(
  sources: readonly SourceCandidate[],
  currentId: string | null,
  today: string,
): SourceDecision {
  const candidates = sources
    .filter((s) => s.enabled && isLicenseActive(s.license_info, today))
    .sort((a, b) => a.priority - b.priority);
  const current = candidates.find((s) => s.id === currentId && s.health !== 'down') ?? null;
  const bestHealthy = candidates.find((s) => s.health === 'healthy') ?? null;

  let next: SourceCandidate | null;
  if (bestHealthy && (!current || bestHealthy.priority < current.priority)) next = bestHealthy;
  else if (current) next = current;
  else next = candidates.find((s) => s.health !== 'down') ?? null;

  const nextId = next?.id ?? null;
  if (nextId === currentId) return { activeSourceId: nextId, change: null };
  if (nextId === null) return { activeSourceId: null, change: 'all_sources_down' };
  if (currentId === null) return { activeSourceId: nextId, change: 'restored' };
  const previous = sources.find((s) => s.id === currentId);
  const change: SourceChange = previous && next!.priority < previous.priority ? 'failback' : 'failover';
  return { activeSourceId: nextId, change };
}
