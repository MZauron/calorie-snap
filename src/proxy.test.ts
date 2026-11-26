import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import { gateToken } from "@/lib/gate/gate";

vi.mock("@/env", () => ({ env: { SITE_PASSWORD: "tulips-42-long" } }));
const { config, proxy } = await import("./proxy");

const request = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, "https://staging.example.test"), cookie ? { headers: { cookie: `cs_gate=${cookie}` } } : undefined);

describe("the staging curtain in the proxy", () => {
  it("sends a visitor without the cookie to /gate, keeping where they were going", () => {
    const res = proxy(request("/today?x=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://staging.example.test/gate?next=%2Ftoday%3Fx%3D1");
  });
  it("lets the gate page itself and a visitor with the right cookie through", () => {
    expect(proxy(request("/gate")).headers.get("location")).toBeNull();
    expect(proxy(request("/today", gateToken("tulips-42-long"))).headers.get("location")).toBeNull();
    expect(proxy(request("/today", gateToken("wrong"))).status).toBe(307);
  });
  it("never runs on the API routes, /demo or files", () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);
    for (const path of ["/api/health", "/demo", "/demo/today", "/_next/static/x.js", "/icons/icon.svg", "/manifest.webmanifest"]) {
      expect(matcher.test(path), path).toBe(false);
    }
    for (const path of ["/", "/today", "/gate", "/demonstration"]) expect(matcher.test(path), path).toBe(true);
  });
});
