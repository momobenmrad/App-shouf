import { pointAlong, type LatLng } from "./geo";

/**
 * Demo-mode driver simulation. Positions are computed from timestamps on every
 * read instead of by a background job, so it works on hosts that sleep between
 * requests (Render free plan) and needs no worker.
 *
 * Timeline after the ride is requested (seconds):
 *   0 → ACCEPT_AFTER             searching for a driver
 *   → + APPROACH_S               driver drives to the pickup point
 *   → + BOARDING_S               waiting at the pickup point
 *   → + TRIP_S                   trip along the route (with a short detour in the middle)
 */
export const ACCEPT_AFTER_S = 4;
export const APPROACH_S = 25;
export const BOARDING_S = 5;
export const TRIP_S = 45;

export type SimPhase = "requested" | "accepted" | "arrived" | "in_progress" | "completed";

export type SimState = {
  phase: SimPhase;
  driverPos: LatLng | null;
  /** Seconds since the ride was requested at which each phase began. */
  offsets: { accepted: number; arrived: number; started: number; completed: number };
};

const lerp = (a: LatLng, b: LatLng, t: number): LatLng => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });

/** Pushes a point ~600 m sideways from the route, to demonstrate detour detection. */
function detourOffset(route: LatLng[], fraction: number): LatLng {
  const p = pointAlong(route, fraction);
  const q = pointAlong(route, Math.min(1, fraction + 0.02));
  const dLat = q.lat - p.lat;
  const dLng = q.lng - p.lng;
  const len = Math.hypot(dLat, dLng) || 1;
  const metres = 600;
  const deg = metres / 111_000;
  return { lat: p.lat - (dLng / len) * deg, lng: p.lng + (dLat / len) * deg };
}

export function simulate(
  elapsedS: number,
  driverStart: LatLng,
  pickup: LatLng,
  route: LatLng[],
  withDetour = true,
): SimState {
  const accepted = ACCEPT_AFTER_S;
  const arrived = accepted + APPROACH_S;
  const started = arrived + BOARDING_S;
  const completed = started + TRIP_S;
  const offsets = { accepted, arrived, started, completed };

  if (elapsedS < accepted) return { phase: "requested", driverPos: null, offsets };
  if (elapsedS < arrived) {
    return { phase: "accepted", driverPos: lerp(driverStart, pickup, (elapsedS - accepted) / APPROACH_S), offsets };
  }
  if (elapsedS < started) return { phase: "arrived", driverPos: pickup, offsets };
  if (elapsedS < completed) {
    const f = (elapsedS - started) / TRIP_S;
    // Between 35% and 60% of the trip the simulated driver leaves the route, then comes back.
    if (withDetour && f > 0.35 && f < 0.6) {
      const bump = Math.sin(((f - 0.35) / 0.25) * Math.PI);
      const on = pointAlong(route, f);
      return { phase: "in_progress", driverPos: lerp(on, detourOffset(route, f), bump), offsets };
    }
    return { phase: "in_progress", driverPos: pointAlong(route, f), offsets };
  }
  return { phase: "completed", driverPos: route[route.length - 1] ?? pickup, offsets };
}

/** Starting points of demo drivers: scattered around a few city centres. */
export const DEMO_DRIVERS: { name: string; car: string; color: string; plate: string; pos: LatLng; rating: number }[] = [
  { name: "كريم ب.", car: "Kia Picanto", color: "صفراء", plate: "215 تونس 4821", pos: { lat: 36.806, lng: 10.18 }, rating: 4.9 },
  { name: "سامي ت.", car: "Hyundai i10", color: "صفراء", plate: "198 تونس 7310", pos: { lat: 36.83, lng: 10.15 }, rating: 4.8 },
  { name: "منير ع.", car: "Peugeot 301", color: "صفراء", plate: "221 تونس 1204", pos: { lat: 36.848, lng: 10.19 }, rating: 4.7 },
  { name: "هادي ق.", car: "Dacia Logan", color: "صفراء", plate: "205 تونس 9981", pos: { lat: 36.865, lng: 10.31 }, rating: 4.9 },
  { name: "نزار م.", car: "Kia Rio", color: "صفراء", plate: "230 تونس 3345", pos: { lat: 36.84, lng: 10.24 }, rating: 4.6 },
  { name: "وليد س.", car: "Hyundai Accent", color: "صفراء", plate: "212 تونس 6650", pos: { lat: 36.81, lng: 10.14 }, rating: 4.8 },
  { name: "أنيس ح.", car: "Kia Picanto", color: "بيضاء", plate: "190 تونس 2271", pos: { lat: 35.83, lng: 10.62 }, rating: 4.7 },
  { name: "رياض ك.", car: "Peugeot 208", color: "بيضاء", plate: "201 تونس 5530", pos: { lat: 35.86, lng: 10.6 }, rating: 4.9 },
  { name: "فتحي ج.", car: "Fiat Tipo", color: "صفراء", plate: "185 تونس 8812", pos: { lat: 34.74, lng: 10.76 }, rating: 4.8 },
  { name: "بلال ز.", car: "Renault Symbol", color: "صفراء", plate: "199 تونس 4410", pos: { lat: 34.725, lng: 10.74 }, rating: 4.6 },
];
