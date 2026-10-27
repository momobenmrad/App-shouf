import { haversine, type LatLng } from "../geo";
import { aiEnabled, parseAddress } from "./ai";
import { PLACES, type Place } from "./gazetteer";
import { containsPhrase, normalize, splitRelation, type Relation } from "./normalize";
import { searchOsm } from "./nominatim";

export type GeocodeResult = {
  pos: LatLng;
  label: string;
  relation: Relation;
  /** How the address was understood, for display ("فهمنا…"). */
  understood: string;
  source: "gazetteer" | "ai+osm" | "osm";
};

/** Best gazetteer match: the longest alias found as a whole phrase in the text. */
export function matchGazetteer(text: string, near?: LatLng): Place | null {
  const n = normalize(text);
  let best: { place: Place; score: number } | null = null;
  for (const place of PLACES) {
    for (const alias of place.aliases) {
      const a = normalize(alias);
      if (!containsPhrase(n, a)) continue;
      // Longer aliases are more specific; a nearby place wins a tie.
      let score = a.length;
      if (near) score += Math.max(0, 5 - haversine(near, place.pos) / 20_000);
      if (!best || score > best.score) best = { place, score };
    }
  }
  return best?.place ?? null;
}

/** Nearest gazetteer city to a point, used as a hint for the AI and OSM search. */
export function nearestCity(p: LatLng): string {
  let best = PLACES[0];
  for (const place of PLACES) if (haversine(p, place.pos) < haversine(p, best.pos)) best = place;
  return best.city;
}

export async function geocode(text: string, near?: LatLng): Promise<GeocodeResult | null> {
  const { relation, rest } = splitRelation(text);
  if (!rest) return null;

  const place = matchGazetteer(rest, near);
  if (place) {
    const refined = await searchOsm(place.osmQuery, place.pos);
    // Keep the OSM position only if it agrees with the gazetteer (guards against homonyms).
    const pos = refined && haversine(refined.pos, place.pos) < 3000 ? refined.pos : place.pos;
    return { pos, label: `${place.nameAr} · ${place.name}`, relation, understood: place.name, source: "gazetteer" };
  }

  const cityHint = near ? nearestCity(near) : undefined;
  if (aiEnabled()) {
    const parsed = await parseAddress(text, cityHint);
    if (parsed?.search_query) {
      const hit =
        (await searchOsm(parsed.search_query, near)) ??
        (parsed.neighborhood ? await searchOsm(`${parsed.neighborhood}, ${parsed.city}`, near) : null);
      if (hit) return { pos: hit.pos, label: hit.label, relation: parsed.relation, understood: parsed.understood_fr, source: "ai+osm" };
    }
  }

  const hit = await searchOsm(cityHint ? `${rest}, ${cityHint}` : rest, near);
  if (hit) return { pos: hit.pos, label: hit.label, relation, understood: hit.label, source: "osm" };
  return null;
}
