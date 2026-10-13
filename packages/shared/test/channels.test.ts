import { describe, expect, it } from 'vitest';
import {
  type HealthState,
  type SourceCandidate,
  daysUntilExpiry,
  decideActiveSource,
  isLicenseActive,
  licenseAllowsTerritory,
  nextHealth,
} from '../src/channels';

const license = { holder: 'TT', agreement_ref: 'A-1', expires_at: '2027-01-31', territories: ['TN', 'FR'] };
const TODAY = '2026-10-12';

const src = (id: string, priority: number, health: SourceCandidate['health'], extra: Partial<SourceCandidate> = {}) =>
  ({ id, priority, health, enabled: true, license_info: license, consecutive_successes: health === 'healthy' ? 5 : 0, ...extra }) satisfies SourceCandidate;

describe('nextHealth', () => {
  const run = (start: HealthState, checks: boolean[]) => checks.reduce((s, ok) => nextHealth(s, { ok }), start);
  const fresh: HealthState = { health: 'unknown', consecutive_failures: 0, consecutive_successes: 0 };

  it('goes down only after 3 consecutive failures', () => {
    expect(run(fresh, [false]).health).toBe('degraded');
    expect(run(fresh, [false, false]).health).toBe('degraded');
    expect(run(fresh, [false, false, false]).health).toBe('down');
    expect(run(fresh, [false, false, true, false]).health).toBe('degraded');
  });

  it('needs 5 successes to recover from down (no flapping)', () => {
    const down = run(fresh, [false, false, false]);
    expect(run(down, [true, true, true, true]).health).toBe('down');
    expect(run(down, [true, true, true, true, true]).health).toBe('healthy');
    expect(run(down, [true, true, false, true, true, true, true]).health).toBe('down');
  });

  it('a healthy source becomes healthy immediately when fresh', () => {
    expect(run(fresh, [true]).health).toBe('healthy');
  });
});

describe('licences', () => {
  it('is valid through its expiry day', () => {
    expect(isLicenseActive(license, '2027-01-31')).toBe(true);
    expect(isLicenseActive(license, '2027-02-01')).toBe(false);
    expect(daysUntilExpiry(license, '2027-01-01')).toBe(30);
  });
  it('checks territories', () => {
    expect(licenseAllowsTerritory(license, 'tn')).toBe(true);
    expect(licenseAllowsTerritory(license, 'MA')).toBe(false);
    expect(licenseAllowsTerritory(license, null)).toBe(false);
  });
});

describe('decideActiveSource', () => {
  it('fails over to the backup when the primary is down', () => {
    const d = decideActiveSource([src('p', 1, 'down'), src('b', 2, 'healthy')], 'p', TODAY);
    expect(d).toEqual({ activeSourceId: 'b', change: 'failover' });
  });

  it('stays on the backup while the primary is recovering', () => {
    expect(decideActiveSource([src('p', 1, 'down'), src('b', 2, 'healthy')], 'b', TODAY).change).toBeNull();
    expect(decideActiveSource([src('p', 1, 'degraded'), src('b', 2, 'healthy')], 'b', TODAY).change).toBeNull();
  });

  it('fails back once the primary is healthy again', () => {
    expect(decideActiveSource([src('p', 1, 'healthy'), src('b', 2, 'healthy')], 'b', TODAY)).toEqual({
      activeSourceId: 'p',
      change: 'failback',
    });
  });

  it('keeps a degraded current source rather than jumping to an unproven one', () => {
    expect(decideActiveSource([src('p', 1, 'degraded'), src('b', 2, 'unknown')], 'p', TODAY).change).toBeNull();
  });

  it('skips disabled sources and expired licences', () => {
    const expired = { ...license, expires_at: '2026-01-01' };
    const d = decideActiveSource(
      [src('p', 1, 'healthy', { license_info: expired }), src('b', 2, 'healthy', { enabled: false }), src('c', 3, 'healthy')],
      'p',
      TODAY,
    );
    expect(d).toEqual({ activeSourceId: 'c', change: 'failover' });
  });

  it('reports when every source is down and when service is restored', () => {
    expect(decideActiveSource([src('p', 1, 'down'), src('b', 2, 'down')], 'b', TODAY)).toEqual({
      activeSourceId: null,
      change: 'all_sources_down',
    });
    expect(decideActiveSource([src('p', 1, 'unknown')], null, TODAY)).toEqual({ activeSourceId: 'p', change: 'restored' });
  });

  it('recovers from a total outage after a single good probe instead of the full hysteresis', () => {
    const allDown = [src('p', 1, 'down'), src('b', 2, 'down')];
    expect(decideActiveSource(allDown, null, TODAY).activeSourceId).toBeNull();
    const backupRecovering = [src('p', 1, 'down'), src('b', 2, 'down', { consecutive_successes: 1 })];
    expect(decideActiveSource(backupRecovering, null, TODAY)).toEqual({ activeSourceId: 'b', change: 'restored' });
    // Not during an ordinary failover: a still-down source is never chosen while another one serves.
    expect(decideActiveSource([src('p', 1, 'down', { consecutive_successes: 2 }), src('b', 2, 'healthy')], 'b', TODAY).change).toBeNull();
  });
});
