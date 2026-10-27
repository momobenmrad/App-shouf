import { tunisHour } from "./pricing";

/**
 * Traffic slowdown applied on top of the free-flow duration returned by OSRM.
 * This is a hand-tuned profile of Tunis rush hours; once enough rides are
 * recorded it is meant to be replaced by factors learned from real trip times
 * (see `rides.actual_duration_s`).
 */
export type TrafficLevel = "fluide" | "moyen" | "dense";

export function trafficFactor(at: Date): { factor: number; level: TrafficLevel } {
  const h = tunisHour(at);
  const day = at.getUTCDay(); // 0 = Sunday; Tunisian weekend is Saturday afternoon + Sunday
  const weekend = day === 0;
  if (!weekend && ((h >= 7 && h < 9) || (h >= 17 && h < 19))) return { factor: 1.6, level: "dense" };
  if (!weekend && ((h >= 12 && h < 14) || (h >= 9 && h < 10) || (h >= 16 && h < 17))) {
    return { factor: 1.3, level: "moyen" };
  }
  if (h >= 22 || h < 6) return { factor: 1.0, level: "fluide" };
  return { factor: 1.15, level: "fluide" };
}
