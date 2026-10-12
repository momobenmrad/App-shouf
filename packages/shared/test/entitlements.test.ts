import { describe, expect, it } from 'vitest';
import { checkEntitlement, effectiveAccess, isSubscriptionActive } from '../src/entitlements';

const base = { access: 'free' as const, geoAllow: [], country: 'TN', isAuthenticated: true, hasActiveSubscription: false };

describe('checkEntitlement', () => {
  it('requires an account even for free content', () => {
    expect(checkEntitlement({ ...base, isAuthenticated: false })).toEqual({ ok: false, reason: 'auth_required' });
  });
  it('lets any signed-in viewer watch free content', () => {
    expect(checkEntitlement(base)).toEqual({ ok: true });
  });
  it('requires a subscription for subscriber content', () => {
    expect(checkEntitlement({ ...base, access: 'subscriber' })).toEqual({ ok: false, reason: 'subscription_required' });
    expect(checkEntitlement({ ...base, access: 'subscriber', hasActiveSubscription: true })).toEqual({ ok: true });
  });
  it('geo-blocks outside allowed territories and fails closed on unknown country', () => {
    expect(checkEntitlement({ ...base, geoAllow: ['TN', 'DZ'], country: 'FR' })).toEqual({ ok: false, reason: 'geo_blocked' });
    expect(checkEntitlement({ ...base, geoAllow: ['TN'], country: null })).toEqual({ ok: false, reason: 'geo_blocked' });
    expect(checkEntitlement({ ...base, geoAllow: ['TN'], country: 'tn' })).toEqual({ ok: true });
  });
});

describe('helpers', () => {
  it('episode access overrides title access', () => {
    expect(effectiveAccess('subscriber', 'free')).toBe('free');
    expect(effectiveAccess('subscriber', null)).toBe('subscriber');
  });
  it('subscription is active only before period end', () => {
    const now = new Date('2026-10-12T00:00:00Z');
    expect(isSubscriptionActive({ status: 'active', current_period_end: '2026-11-12T00:00:00Z' }, now)).toBe(true);
    expect(isSubscriptionActive({ status: 'active', current_period_end: '2026-10-11T00:00:00Z' }, now)).toBe(false);
    expect(isSubscriptionActive({ status: 'expired', current_period_end: '2026-11-12T00:00:00Z' }, now)).toBe(false);
    expect(isSubscriptionActive(null, now)).toBe(false);
  });
});
