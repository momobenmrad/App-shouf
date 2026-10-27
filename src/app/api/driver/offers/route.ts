import { requireUser } from "@/lib/auth";
import { error, json } from "@/lib/http";
import { offersFor } from "@/lib/rides";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser("driver");
  if (!user) return error("Connexion chauffeur requise", 401);
  return json({ offers: await offersFor(user.uid) });
}
