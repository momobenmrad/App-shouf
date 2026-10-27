import { z } from "zod";
import { setSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { body, error, json } from "@/lib/http";
import { registerDriver } from "@/lib/rides";

const Login = z.object({
  phone: z.string().trim().regex(/^\+?[0-9 ]{8,16}$/, "numéro invalide"),
  name: z.string().trim().min(2).max(60),
  role: z.enum(["rider", "driver"]),
  car: z.object({ model: z.string().trim().min(2).max(40), color: z.string().trim().min(2).max(20), plate: z.string().trim().min(4).max(20) }).optional(),
});

export async function POST(req: Request) {
  const b = await body(req, Login);
  if ("res" in b) return b.res;
  const { phone, name, role, car } = b.data;
  const normalized = phone.replace(/\s+/g, "");
  if (role === "driver" && !car) return error("Infos de la voiture requises pour un chauffeur");

  const existing = (await query<{ id: number; role: string }>("SELECT id, role FROM users WHERE phone=$1", [normalized]))[0];
  if (existing && existing.role !== role) return error("Ce numéro est déjà inscrit avec un autre rôle", 409);
  const id = existing
    ? existing.id
    : (await query<{ id: number }>("INSERT INTO users (phone, name, role) VALUES ($1,$2,$3) RETURNING id", [normalized, name, role]))[0].id;
  if (role === "driver" && car) await registerDriver(id, car);
  await setSession({ uid: id, role, name });
  return json({ ok: true, role });
}
