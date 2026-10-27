import { z } from "zod";
import { checkAdminPassword, setSession } from "@/lib/auth";
import { body, error, json } from "@/lib/http";

export async function POST(req: Request) {
  const b = await body(req, z.object({ password: z.string().min(1).max(200) }));
  if ("res" in b) return b.res;
  if (!checkAdminPassword(b.data.password)) return error("Mot de passe incorrect", 401);
  await setSession({ admin: true });
  return json({ ok: true });
}
