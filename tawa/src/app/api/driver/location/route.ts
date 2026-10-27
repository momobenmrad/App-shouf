import { requireUser } from "@/lib/auth";
import { body, error, json, LatLngSchema } from "@/lib/http";
import { DETOUR_THRESHOLD_M, updateDriverLocation } from "@/lib/rides";

export async function POST(req: Request) {
  const user = await requireUser("driver");
  if (!user) return error("Connexion chauffeur requise", 401);
  const b = await body(req, LatLngSchema);
  if ("res" in b) return b.res;
  const { offRouteM } = await updateDriverLocation(user.uid, b.data);
  return json({ offRouteM, detour: offRouteM !== null && offRouteM > DETOUR_THRESHOLD_M });
}
