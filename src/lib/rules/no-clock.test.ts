// src/lib/rules is pure: no clock, no I/O, no environment. The zone and the instant are always passed in.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** What a rules file must never contain, with why. */
const FORBIDDEN: [RegExp, string][] = [
  [/\bDate\.now\s*\(/, "reads the clock (Date.now)"],
  [/\bnew\s+Date\s*\(\s*\)/, "reads the clock (new Date())"],
  [/\bperformance\.now\s*\(/, "reads the clock (performance.now)"],
  [/\bnew\s+TZDate\s*\(\s*\)/, "reads the clock (new TZDate())"],
  [/\bprocess\.(env|hrtime)\b/, "reads the environment"],
  [/\bfetch\s*\(/, "does I/O (fetch)"],
  [/\bMath\.random\s*\(/, "is not deterministic"],
  [/\bgetTimezoneOffset\s*\(/, "uses the machine's zone"],
  [/\.(getHours|getDate|getDay|getMonth|getFullYear|getMinutes)\s*\(/, "reads a date in the machine's zone (only TZDate in time.ts may)"],
  [/from\s+["'](node:|fs|path|http|https|child_process|net|os)/, "imports I/O"],
  [/from\s+["'](@\/lib\/db|@\/lib\/integrations|@\/env|@supabase|@anthropic-ai|next|react|server-only)/, "imports I/O or the app"],
];

export function violations(source: string, file: string): string[] {
  return FORBIDDEN.flatMap(([pattern, why]) => {
    if (!pattern.test(source)) return [];
    // time.ts reads the date parts of a TZDate, which are in the zone it was given, not the machine's.
    if (file === "time.ts" && why.startsWith("reads a date in the machine's zone")) return [];
    return [`${file} ${why}`];
  });
}

describe("src/lib/rules is pure", () => {
  it("no rules file reads the clock, the machine's zone, the environment or does I/O", () => {
    const files = readdirSync(__dirname).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(8);
    expect(files.flatMap((f) => violations(readFileSync(join(__dirname, f), "utf8"), f))).toEqual([]);
  });

  it("the check catches each kind (so it can't pass by accident)", () => {
    expect(violations("const t = Date.now();", "x.ts")).toHaveLength(1);
    expect(violations("const t = new Date();", "x.ts")).toHaveLength(1);
    expect(violations("const t = new Date(ms);", "x.ts")).toHaveLength(0);
    expect(violations('import { readFileSync } from "node:fs";', "x.ts")).toHaveLength(1);
    expect(violations('import { adminClient } from "@/lib/db/admin";', "x.ts")).toHaveLength(1);
    expect(violations("const h = d.getHours();", "x.ts")).toHaveLength(1);
    expect(violations("const k = process.env.KEY;", "x.ts")).toHaveLength(1);
  });
});
