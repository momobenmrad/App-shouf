import 'server-only';
import { NextResponse } from 'next/server';
import type { z } from 'zod';

export function jsonError(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function json<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** Parses a JSON body against a schema; returns a 400 response on failure. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, 'invalid_json') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, response: jsonError(400, 'invalid_body', { issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) }) };
  }
  return { ok: true, data: parsed.data };
}

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function isSameOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // same-origin fetches from older browsers / server-to-server
  return origin === new URL(appUrl).origin;
}
