import { getSession } from "@/lib/auth";
import { json } from "@/lib/http";
import { activeRideFor } from "@/lib/rides";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s) return json({ session: null });
  if ("admin" in s) return json({ session: s });
  return json({ session: s, activeRideId: await activeRideFor(s.uid, s.role) });
}
