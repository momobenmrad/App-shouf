import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { geocode } from "@/lib/geocode";
import { body, error, json, LatLngSchema } from "@/lib/http";

export async function POST(req: Request) {
  if (!(await requireUser())) return error("Connexion requise", 401);
  const b = await body(req, z.object({ text: z.string().trim().min(2).max(200), near: LatLngSchema.optional() }));
  if ("res" in b) return b.res;
  const result = await geocode(b.data.text, b.data.near);
  if (!result) return error("Lieu introuvable", 404);
  return json(result);
}
