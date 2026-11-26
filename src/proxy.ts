// Runs before every page and server action (not the API routes, /demo, Next's own files or anything with a file extension: see
// `config`). Today it only holds the staging curtain; T05 adds the session renewal (as in MZauron/playdate src/proxy.ts).
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";
import { GATE_COOKIE, gateOpen } from "@/lib/gate/gate";

export function proxy(request: NextRequest) {
  // Staging curtain (SITE_PASSWORD): every page and action waits behind /gate until the password was given. The API routes (the
  // health check) and /demo (CS-21, "Just looking?") are outside this matcher.
  const { pathname, search } = request.nextUrl;
  if (pathname !== "/gate" && !gateOpen(env.SITE_PASSWORD, request.cookies.get(GATE_COOKIE)?.value)) {
    const gate = new URL("/gate", request.url);
    gate.searchParams.set("next", pathname + search);
    return NextResponse.redirect(gate);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/|demo(?:/|$)|_next/|.*\\..*).*)"] };
