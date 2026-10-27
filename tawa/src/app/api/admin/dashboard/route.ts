import { dashboard } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { error, json } from "@/lib/http";
import { listTariffs } from "@/lib/rides";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return error("Accès administrateur requis", 401);
  const [stats, tariffs] = await Promise.all([dashboard(), listTariffs()]);
  return json({ ...stats, tariffs });
}
