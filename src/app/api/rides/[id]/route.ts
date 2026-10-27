import { z } from "zod";
import { getSession } from "@/lib/auth";
import { body, error, json } from "@/lib/http";
import { applyAction, getRideView, rideOwner } from "@/lib/rides";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function authorize(id: number) {
  const s = await getSession();
  const owner = await rideOwner(id);
  if (!s || !owner) return null;
  if ("admin" in s) return { s, owner };
  if (s.role === "rider" && owner.rider_id === s.uid) return { s, owner };
  if (s.role === "driver" && (owner.driver_id === s.uid || owner.status === "requested")) return { s, owner };
  return null;
}

export async function GET(_req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return error("id invalide");
  if (!(await authorize(id))) return error("Introuvable", 404);
  const view = await getRideView(id);
  if (!view) return error("Introuvable", 404);
  return json(view);
}

const Action = z.object({ action: z.enum(["cancel", "accept", "arrive", "start", "complete", "rate"]), rating: z.number().int().min(1).max(5).optional() });

export async function POST(req: Request, { params }: Ctx) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return error("id invalide");
  const auth = await authorize(id);
  if (!auth || "admin" in auth.s) return error("Introuvable", 404);
  const b = await body(req, Action);
  if ("res" in b) return b.res;
  const ok = await applyAction(id, { uid: auth.s.uid, role: auth.s.role }, b.data.action, { rating: b.data.rating });
  if (!ok) return error("Action impossible dans l'état actuel de la course", 409);
  return json(await getRideView(id));
}
