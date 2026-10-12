import type { Rendition } from './database.types';

/** Encoding ladder, lowest first. Heights are capped at the source resolution. */
export const LADDER: readonly Rendition[] = [
  { name: '240p', width: 426, height: 240, videoBitrateKbps: 400, audioBitrateKbps: 64 },
  { name: '360p', width: 640, height: 360, videoBitrateKbps: 800, audioBitrateKbps: 96 },
  { name: '480p', width: 854, height: 480, videoBitrateKbps: 1400, audioBitrateKbps: 128 },
  { name: '720p', width: 1280, height: 720, videoBitrateKbps: 2800, audioBitrateKbps: 128 },
  { name: '1080p', width: 1920, height: 1080, videoBitrateKbps: 5000, audioBitrateKbps: 128 },
];

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/**
 * Renditions to produce for a source. A rung is kept when the source is at least 90% of its
 * height (so 1072p sources still get 1080p). Widths follow the source aspect ratio.
 */
export function selectRenditions(sourceWidth: number, sourceHeight: number): Rendition[] {
  if (sourceWidth <= 0 || sourceHeight <= 0) throw new Error('invalid source dimensions');
  const aspect = sourceWidth / sourceHeight;
  const rungs = LADDER.filter((r) => sourceHeight >= r.height * 0.9);
  const chosen = rungs.length > 0 ? rungs : [LADDER[0]!];
  return chosen.map((r) => {
    const height = Math.min(r.height, even(sourceHeight));
    return { ...r, height, width: even(height * aspect) };
  });
}
