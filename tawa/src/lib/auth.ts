import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal signed-cookie session. Login is by phone number without SMS
 * verification for now; an OTP step (e.g. via a Tunisian SMS gateway) slots in
 * before `setSession` without changing the rest of the app.
 */
export type Session = { uid: number; role: "rider" | "driver"; name: string } | { admin: true };

const COOKIE = "tawa_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET manquant");
  return "dev-only-secret";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  return decodeSession((await cookies()).get(COOKIE)?.value);
}

export async function setSession(s: Session) {
  (await cookies()).set(COOKIE, encodeSession(s), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_S,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function requireUser(role?: "rider" | "driver") {
  const s = await getSession();
  if (!s || "admin" in s) return null;
  if (role && s.role !== role) return null;
  return s;
}

export async function requireAdmin() {
  const s = await getSession();
  return s && "admin" in s ? s : null;
}

export function checkAdminPassword(given: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin");
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
