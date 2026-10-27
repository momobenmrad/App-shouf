import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { body, error, json, LatLngSchema } from "@/lib/http";
import { createRide, PAYMENT_METHODS } from "@/lib/rides";

const NewRide = z.object({
  pickup: LatLngSchema,
  dropoff: LatLngSchema,
  pickupLabel: z.string().trim().min(1).max(200),
  dropoffLabel: z.string().trim().min(1).max(200),
  paymentMethod: z.enum(PAYMENT_METHODS as [string, ...string[]]),
});

export async function POST(req: Request) {
  const user = await requireUser("rider");
  if (!user) return error("Connexion client requise", 401);
  const b = await body(req, NewRide);
  if ("res" in b) return b.res;
  const id = await createRide({ riderId: user.uid, ...b.data, paymentMethod: b.data.paymentMethod as (typeof PAYMENT_METHODS)[number] });
  return json({ id }, 201);
}
