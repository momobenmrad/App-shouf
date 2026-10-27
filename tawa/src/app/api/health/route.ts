import { query } from "@/lib/db";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await query("SELECT 1");
    return json({ ok: true, db: true });
  } catch (err) {
    return json({ ok: false, db: false, error: (err as Error).message }, 503);
  }
}
