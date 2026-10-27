import { z } from "zod";
import { saveBrand } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { body, error, json } from "@/lib/http";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const Brand = z.object({
  name: z.string().trim().min(1).max(30),
  nameAr: z.string().trim().min(1).max(30),
  slogan: z.string().trim().max(60),
  primary: color,
  accent: color,
});

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return error("Accès administrateur requis", 401);
  const b = await body(req, Brand);
  if ("res" in b) return b.res;
  await saveBrand(b.data);
  return json({ ok: true });
}
