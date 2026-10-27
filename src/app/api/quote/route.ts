import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { body, error, json, LatLngSchema } from "@/lib/http";
import { quote } from "@/lib/rides";

export async function POST(req: Request) {
  if (!(await requireUser())) return error("Connexion requise", 401);
  const b = await body(req, z.object({ pickup: LatLngSchema, dropoff: LatLngSchema }));
  if ("res" in b) return b.res;
  const q = await quote(b.data.pickup, b.data.dropoff);
  return json({
    city: q.city,
    distanceM: Math.round(q.route.distanceM),
    durationS: Math.round(q.route.durationS),
    baseDurationS: Math.round(q.route.baseDurationS),
    traffic: q.route.traffic,
    routeSource: q.route.source,
    route: q.route.geometry,
    fare: q.fare,
  });
}
