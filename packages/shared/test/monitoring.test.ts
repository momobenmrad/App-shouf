import { describe, expect, it } from 'vitest';
import { MONITOR_RULES, type ProbeObservation, judgeProbe } from '../src/monitoring';

const healthy: ProbeObservation = { httpStatus: 200, latencyMs: 120, playable: true, mediaSequence: 500, ended: false, bitrateKbps: 2400, error: null };
const fresh = { lastMediaSequence: null, lastSequenceChangeAt: null };
const NOW = 1_800_000_000_000;

describe('judgeProbe', () => {
  it('passes a healthy, advancing playlist', () => {
    expect(judgeProbe(healthy, fresh, NOW)).toEqual({ ok: true, degraded: false, error: null, lastMediaSequence: 500, lastSequenceChangeAt: NOW });
  });

  it('fails on HTTP errors, timeouts and empty playlists', () => {
    expect(judgeProbe({ ...healthy, httpStatus: 503 }, fresh, NOW)).toMatchObject({ ok: false, error: 'HTTP 503' });
    expect(judgeProbe({ ...healthy, httpStatus: 0, error: 'timeout' }, fresh, NOW)).toMatchObject({ ok: false, error: 'timeout' });
    expect(judgeProbe({ ...healthy, playable: false }, fresh, NOW)).toMatchObject({ ok: false, error: 'playlist without segments' });
  });

  it('treats an ENDLIST on a live source as down', () => {
    expect(judgeProbe({ ...healthy, ended: true }, fresh, NOW).ok).toBe(false);
  });

  it('marks a slow playlist as degraded but up', () => {
    expect(judgeProbe({ ...healthy, latencyMs: MONITOR_RULES.slowLatencyMs + 1 }, fresh, NOW)).toMatchObject({ ok: true, degraded: true });
  });

  it('detects a stalled playlist only after the grace period', () => {
    const prev = { lastMediaSequence: 500, lastSequenceChangeAt: NOW - MONITOR_RULES.stallAfterMs + 1000 };
    expect(judgeProbe(healthy, prev, NOW)).toMatchObject({ ok: true, lastSequenceChangeAt: prev.lastSequenceChangeAt });
    const later = NOW + 2000;
    expect(judgeProbe(healthy, prev, later)).toMatchObject({ ok: false, error: 'playlist stalled' });
    expect(judgeProbe({ ...healthy, mediaSequence: 501 }, prev, later)).toMatchObject({ ok: true, lastMediaSequence: 501, lastSequenceChangeAt: later });
  });
});
