// Interpretation of a single source probe. The I/O lives in the worker; the rules live here.
import type { CheckOutcome } from './channels';

export const MONITOR_RULES = {
  /** Probe period per source. */
  intervalMs: 30_000,
  /** A playlist that is still reachable but slower than this is degraded. */
  slowLatencyMs: 3_000,
  /** A live playlist whose media sequence has not advanced for this long is stalled. */
  stallAfterMs: 45_000,
  /** Bytes of the last segment to sample for the bitrate estimate. */
  bitrateSampleBytes: 2 * 1024 * 1024,
} as const;

export interface ProbeObservation {
  /** HTTP status of the playlist request, 0 on network failure/timeout. */
  httpStatus: number;
  latencyMs: number;
  /** Playlist parsed and contains at least one segment. */
  playable: boolean;
  /** Current media sequence (media playlist) or null when unknown. */
  mediaSequence: number | null;
  /** Live playlist flagged #EXT-X-ENDLIST: the source stopped broadcasting. */
  ended: boolean;
  bitrateKbps: number | null;
  error: string | null;
}

export interface PreviousObservation {
  lastMediaSequence: number | null;
  /** When the media sequence last changed. */
  lastSequenceChangeAt: number | null;
}

export interface ProbeVerdict extends CheckOutcome {
  error: string | null;
  /** Updated sequence tracking to persist. */
  lastMediaSequence: number | null;
  lastSequenceChangeAt: number | null;
}

export function judgeProbe(obs: ProbeObservation, prev: PreviousObservation, nowMs: number): ProbeVerdict {
  if (obs.httpStatus < 200 || obs.httpStatus >= 300) {
    return { ok: false, error: obs.error ?? `HTTP ${obs.httpStatus}`, lastMediaSequence: prev.lastMediaSequence, lastSequenceChangeAt: prev.lastSequenceChangeAt };
  }
  if (!obs.playable) {
    return { ok: false, error: obs.error ?? 'playlist without segments', lastMediaSequence: prev.lastMediaSequence, lastSequenceChangeAt: prev.lastSequenceChangeAt };
  }
  if (obs.ended) {
    return { ok: false, error: 'stream ended (EXT-X-ENDLIST)', lastMediaSequence: obs.mediaSequence, lastSequenceChangeAt: nowMs };
  }

  let lastMediaSequence = prev.lastMediaSequence;
  let lastSequenceChangeAt = prev.lastSequenceChangeAt;
  if (obs.mediaSequence !== null && obs.mediaSequence !== prev.lastMediaSequence) {
    lastMediaSequence = obs.mediaSequence;
    lastSequenceChangeAt = nowMs;
  } else if (lastSequenceChangeAt === null) {
    lastSequenceChangeAt = nowMs;
  }

  const stalled = obs.mediaSequence !== null && lastSequenceChangeAt !== null && nowMs - lastSequenceChangeAt > MONITOR_RULES.stallAfterMs;
  if (stalled) {
    return { ok: false, error: 'playlist stalled', lastMediaSequence, lastSequenceChangeAt };
  }
  const slow = obs.latencyMs > MONITOR_RULES.slowLatencyMs;
  return { ok: true, degraded: slow, error: slow ? `slow playlist (${obs.latencyMs} ms)` : null, lastMediaSequence, lastSequenceChangeAt };
}
