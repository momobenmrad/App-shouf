import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { body, error, json } from "@/lib/http";
import { getDriver, setDriverOnline } from "@/lib/rides";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser("driver");
  if (!user) return error("Connexion chauffeur requise", 401);
  const d = await getDriver(user.uid);
  if (!d) return error("Profil chauffeur introuvable", 404);
  return json({ online: d.online, name: d.name, car: d.car_model, color: d.car_color, plate: d.plate, rating: Number(d.rating) });
}

export async function POST(req: Request) {
  const user = await requireUser("driver");
  if (!user) return error("Connexion chauffeur requise", 401);
  const b = await body(req, z.object({ online: z.boolean() }));
  if ("res" in b) return b.res;
  await setDriverOnline(user.uid, b.data.online);
  return json({ online: b.data.online });
}
