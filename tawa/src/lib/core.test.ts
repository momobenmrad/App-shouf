import { describe, expect, it } from "vitest";
import { distanceToPolyline, haversine, pointAlong, polylineLength } from "./geo";
import { computeFare, DEFAULT_TARIFFS, isNight } from "./pricing";
import { estimateRoute } from "./routing";
import { trafficFactor } from "./traffic";
import { matchGazetteer } from "./geocode";
import { normalize, splitRelation } from "./geocode/normalize";
import { simulate, ACCEPT_AFTER_S, APPROACH_S, BOARDING_S, TRIP_S } from "./simulation";

const tunis = DEFAULT_TARIFFS[0];
const bourguiba = { lat: 36.8003, lng: 10.1857 };
const manar = { lat: 36.8389, lng: 10.1569 };

describe("geo", () => {
  it("measures Bourguiba → El Manar as about 5 km as the crow flies", () => {
    const d = haversine(bourguiba, manar);
    expect(d).toBeGreaterThan(4500);
    expect(d).toBeLessThan(5300);
  });

  it("finds the distance from a point to a polyline", () => {
    const line = [{ lat: 36.8, lng: 10.1 }, { lat: 36.8, lng: 10.2 }];
    // 0.01° of latitude ≈ 1.11 km
    expect(distanceToPolyline({ lat: 36.81, lng: 10.15 }, line)).toBeCloseTo(1112, -1);
    expect(distanceToPolyline({ lat: 36.8, lng: 10.15 }, line)).toBeLessThan(1);
  });

  it("walks along a polyline", () => {
    const line = [{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }, { lat: 0, lng: 2 }];
    const mid = pointAlong(line, 0.5);
    expect(mid.lng).toBeCloseTo(1, 5);
    expect(polylineLength(line)).toBeCloseTo(2 * haversine({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }), 3);
  });
});

describe("pricing", () => {
  const noon = new Date("2026-10-27T11:00:00Z"); // 12:00 in Tunis
  const night = new Date("2026-10-27T22:30:00Z"); // 23:30 in Tunis

  it("charges base + km + minutes, rounded to 100 millimes", () => {
    const f = computeFare(tunis, 7400, 18 * 60, noon);
    // 0.9 + 7.4 × 0.75 + 18 × 0.06 = 7.53
    expect(f.total).toBe(7.5);
    expect(f.night).toBe(false);
    expect(f.commission).toBeCloseTo(0.9, 3);
    expect(f.driverEarnings).toBeCloseTo(6.6, 3);
  });

  it("applies the night tariff after 21h Tunis time", () => {
    expect(isNight(tunis, night)).toBe(true);
    expect(isNight(tunis, noon)).toBe(false);
    expect(computeFare(tunis, 7400, 18 * 60, night).total).toBe(11.3);
  });

  it("never goes below the minimum fare", () => {
    expect(computeFare(tunis, 300, 60, noon).total).toBe(tunis.minimumFare);
  });
});

describe("traffic and routing fallback", () => {
  it("slows trips down at rush hour", () => {
    expect(trafficFactor(new Date("2026-10-27T07:30:00Z")).level).toBe("dense"); // 08:30 Tuesday
    expect(trafficFactor(new Date("2026-10-27T23:00:00Z")).level).toBe("fluide");
  });

  it("estimates a road distance longer than the straight line", () => {
    const r = estimateRoute(bourguiba, manar, new Date("2026-10-27T11:00:00Z"));
    expect(r.distanceM).toBeGreaterThan(haversine(bourguiba, manar));
    expect(r.source).toBe("estimate");
  });
});

describe("derja address understanding", () => {
  it("normalises Arabic variants and accents", () => {
    expect(normalize("أريانة")).toBe("اريانه");
    expect(normalize("Près de l'Aéroport")).toBe("pres de l aeroport");
  });

  it("detects the relation word in Arabic, Arabizi and French", () => {
    expect(splitRelation("حذا مونوبري المنار")).toEqual({ relation: "near", rest: "مونوبري المنار" });
    expect(splitRelation("9odem el bardo")).toEqual({ relation: "front", rest: "el bardo" });
    expect(splitRelation("derrière la marsa").relation).toBe("behind");
  });

  it("prefers the most specific landmark", () => {
    expect(matchGazetteer("مونوبري المنار")?.id).toBe("manar-monoprix");
    expect(matchGazetteer("المنار")?.id).toBe("manar");
    expect(matchGazetteer("lac 2")?.id).toBe("lac2");
    expect(matchGazetteer("ena fl matar")?.id).toBe("tun-airport");
    expect(matchGazetteer("dar khalti")).toBeNull();
    expect(matchGazetteer("المطار")?.id).toBe("tun-airport");
    expect(matchGazetteer("sidi bou said")?.id).toBe("sidi-bou-said");
  });
});

describe("demo simulation", () => {
  const route = [manar, { lat: 36.82, lng: 10.17 }, bourguiba];
  const start = { lat: 36.85, lng: 10.15 };

  it("goes through every phase in order", () => {
    expect(simulate(1, start, manar, route).phase).toBe("requested");
    expect(simulate(ACCEPT_AFTER_S + 1, start, manar, route).phase).toBe("accepted");
    expect(simulate(ACCEPT_AFTER_S + APPROACH_S + 1, start, manar, route).phase).toBe("arrived");
    const t = ACCEPT_AFTER_S + APPROACH_S + BOARDING_S;
    expect(simulate(t + 1, start, manar, route).phase).toBe("in_progress");
    expect(simulate(t + TRIP_S + 1, start, manar, route).phase).toBe("completed");
  });

  it("leaves the route mid-trip to exercise detour detection", () => {
    const t = ACCEPT_AFTER_S + APPROACH_S + BOARDING_S;
    const mid = simulate(t + TRIP_S * 0.475, start, manar, route).driverPos!;
    expect(distanceToPolyline(mid, route)).toBeGreaterThan(300);
    const later = simulate(t + TRIP_S * 0.8, start, manar, route).driverPos!;
    expect(distanceToPolyline(later, route)).toBeLessThan(5);
  });
});
