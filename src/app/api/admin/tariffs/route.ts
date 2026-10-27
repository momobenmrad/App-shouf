import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { body, error, json } from "@/lib/http";
import { saveTariff } from "@/lib/rides";

const Tariff = z.object({
  city: z.string().trim().min(2).max(40),
  baseFare: z.number().min(0).max(50),
  perKm: z.number().min(0).max(20),
  perMinute: z.number().min(0).max(5),
  minimumFare: z.number().min(0).max(100),
  nightMultiplier: z.number().min(1).max(3),
  nightStartHour: z.number().int().min(0).max(23),
  nightEndHour: z.number().int().min(0).max(23),
  commissionRate: z.number().min(0).max(0.5),
});

export async function PUT(req: Request) {
  if (!(await requireAdmin())) return error("Accès administrateur requis", 401);
  const b = await body(req, Tariff);
  if ("res" in b) return b.res;
  await saveTariff(b.data);
  return json({ ok: true });
}
