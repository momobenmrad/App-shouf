export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Local equirectangular projection around `origin`, in metres. Accurate enough
 * for the few-kilometre segments we compare against (error well under 1%).
 */
function project(p: LatLng, origin: LatLng): [number, number] {
  const x = toRad(p.lng - origin.lng) * Math.cos(toRad(origin.lat)) * EARTH_RADIUS_M;
  const y = toRad(p.lat - origin.lat) * EARTH_RADIUS_M;
  return [x, y];
}

/** Shortest distance in metres from `p` to the segment a–b. */
export function distanceToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const [px, py] = project(p, a);
  const [bx, by] = project(b, a);
  const len2 = bx * bx + by * by;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  return Math.hypot(px - t * bx, py - t * by);
}

/** Shortest distance in metres from `p` to a polyline. */
export function distanceToPolyline(p: LatLng, line: LatLng[]): number {
  if (line.length === 0) return Infinity;
  if (line.length === 1) return haversine(p, line[0]);
  let best = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    best = Math.min(best, distanceToSegment(p, line[i], line[i + 1]));
  }
  return best;
}

/** Total length of a polyline in metres. */
export function polylineLength(line: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < line.length - 1; i++) total += haversine(line[i], line[i + 1]);
  return total;
}

/** Point at `fraction` (0..1) of the way along a polyline. */
export function pointAlong(line: LatLng[], fraction: number): LatLng {
  if (line.length === 0) throw new Error("empty polyline");
  if (line.length === 1 || fraction <= 0) return line[0];
  if (fraction >= 1) return line[line.length - 1];
  let target = polylineLength(line) * fraction;
  for (let i = 0; i < line.length - 1; i++) {
    const seg = haversine(line[i], line[i + 1]);
    if (target <= seg) {
      const t = seg === 0 ? 0 : target / seg;
      return {
        lat: line[i].lat + (line[i + 1].lat - line[i].lat) * t,
        lng: line[i].lng + (line[i + 1].lng - line[i].lng) * t,
      };
    }
    target -= seg;
  }
  return line[line.length - 1];
}

/** Rough bounding box of mainland Tunisia plus Djerba, used to reject bad geocodes. */
export function isInTunisia(p: LatLng): boolean {
  return p.lat >= 30.2 && p.lat <= 37.6 && p.lng >= 7.5 && p.lng <= 11.7;
}
