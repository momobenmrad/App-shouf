import { haversine, type LatLng } from "./geo";
import { trafficFactor, type TrafficLevel } from "./traffic";

export type Route = {
  distanceM: number;
  /** Free-flow duration from the routing engine. */
  baseDurationS: number;
  /** Duration adjusted for expected traffic at departure time. */
  durationS: number;
  traffic: TrafficLevel;
  geometry: LatLng[];
  source: "osrm" | "estimate";
};

const OSRM_URL = () => (process.env.OSRM_URL || "https://router.project-osrm.org").replace(/\/$/, "");

/** Straight-line fallback when the routing engine is unreachable: Tunis road network detour ≈ 1.35×, 28 km/h. */
export function estimateRoute(from: LatLng, to: LatLng, at: Date): Route {
  const distanceM = haversine(from, to) * 1.35;
  const baseDurationS = distanceM / (28 / 3.6);
  const { factor, level } = trafficFactor(at);
  return { distanceM, baseDurationS, durationS: baseDurationS * factor, traffic: level, geometry: [from, to], source: "estimate" };
}

export async function getRoute(from: LatLng, to: LatLng, at = new Date()): Promise<Route> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_URL()}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "tawa/0.1" } });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = (await res.json()) as {
      code: string;
      routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
    };
    const r = data.routes?.[0];
    if (data.code !== "Ok" || !r) throw new Error(`OSRM ${data.code}`);
    const { factor, level } = trafficFactor(at);
    return {
      distanceM: r.distance,
      baseDurationS: r.duration,
      durationS: r.duration * factor,
      traffic: level,
      geometry: r.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      source: "osrm",
    };
  } catch (err) {
    console.warn("routing fallback:", (err as Error).message);
    return estimateRoute(from, to, at);
  }
}
