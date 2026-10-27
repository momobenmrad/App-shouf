import { isInTunisia, type LatLng } from "../geo";

const NOMINATIM_URL = () => (process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org").replace(/\/$/, "");

export type OsmHit = { pos: LatLng; label: string };

/**
 * Forward geocoding restricted to Tunisia. The public Nominatim instance allows
 * about one request per second and requires an identifying User-Agent; a
 * production deployment should point NOMINATIM_URL at its own instance.
 */
export async function searchOsm(query: string, near?: LatLng): Promise<OsmHit | null> {
  const params = new URLSearchParams({ q: query, format: "jsonv2", countrycodes: "tn", limit: "1", "accept-language": "fr,ar" });
  if (near) {
    // ~25 km box around the hint, preferred but not enforced
    const d = 0.25;
    params.set("viewbox", `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`);
  }
  try {
    const res = await fetch(`${NOMINATIM_URL()}/search?${params}`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "tawa/0.1 (taxi demo; contact via repository)" },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const row = rows[0];
    if (!row) return null;
    const pos = { lat: Number(row.lat), lng: Number(row.lon) };
    if (!isInTunisia(pos)) return null;
    return { pos, label: row.display_name.split(",").slice(0, 3).join(",") };
  } catch {
    return null;
  }
}
