import { NextResponse } from "next/server";
import "@/env";

export const dynamic = "force-dynamic";

// For Railway's health check and people: 200 when the app answers. T04 adds whether the database is reachable.
// Outside the staging curtain (SITE_PASSWORD) once it exists. No data in the answer.
export function GET() {
  return NextResponse.json({ ok: true });
}
