// From MZauron/playdate src/lib/gate/gate.ts @ eeb9dd8 (Kindred's invite page and cookie name removed).
// The staging and demo curtain (SITE_PASSWORD, CLAUDE.md "Secrets and environments"). Not account security: it only keeps
// strangers and search engines off a test site. /demo and the API routes (the health check) are never behind it.
import { createHmac, timingSafeEqual } from "node:crypto";

export const GATE_COOKIE = "cs_gate";
export const GATE_DAYS = 30;

/** What the cookie holds once the password was right: a keyed hash, never the password itself. */
export function gateToken(password: string): string {
  return createHmac("sha256", password).update("calorie-snap-gate-v1").digest("hex");
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** True when there is no curtain, or the cookie shows the password was given. */
export function gateOpen(password: string | undefined, cookie: string | undefined): boolean {
  if (!password) return true;
  return !!cookie && same(cookie, gateToken(password));
}

export function passwordMatches(password: string, attempt: string): boolean {
  return same(gateToken(password), gateToken(attempt));
}

/** Where to go after the curtain: a path on this site only (never `//other.site` or a full URL). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
