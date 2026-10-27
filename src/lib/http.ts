import { NextResponse } from "next/server";
import { z } from "zod";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export const LatLngSchema = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

/** Parses a JSON body against a schema; returns either the data or a ready 400 response. */
export async function body<T extends z.ZodType>(req: Request, schema: T): Promise<{ data: z.infer<T> } | { res: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { res: error("JSON invalide") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { res: error(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")) };
  return { data: parsed.data };
}
