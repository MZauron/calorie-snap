// docs/rules.test-cases.md and the tests stay in step, both ways: every case there has exactly one test named by its id,
// and every test named with an id has a case there.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..", "..");
const ID = /CS-\d{2}[a-z]/g;

const documented = [...readFileSync(join(root, "docs", "rules.test-cases.md"), "utf8").matchAll(/^\| (CS-\d{2}[a-z]) \|/gm)].map((m) => m[1]!);

const tested: string[] = [];
for (const file of readdirSync(__dirname).filter((f) => f.endsWith(".test.ts") && f !== "cases.test.ts")) {
  const source = readFileSync(join(__dirname, file), "utf8");
  for (const m of source.matchAll(/\bit\(\s*["'`](CS-\d{2}[a-z])\b/g)) tested.push(m[1]!);
}

const duplicates = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

describe("docs/rules.test-cases.md ↔ tests", () => {
  it("lists cases", () => {
    expect(documented.length).toBeGreaterThan(50);
    expect(documented.every((id) => id.match(ID))).toBe(true);
  });
  it("every case has a test", () => {
    expect(documented.filter((id) => !tested.includes(id))).toEqual([]);
  });
  it("every test id is a case", () => {
    expect(tested.filter((id) => !documented.includes(id))).toEqual([]);
  });
  it("ids are unique in both", () => {
    expect(duplicates(documented)).toEqual([]);
    expect(duplicates(tested)).toEqual([]);
  });
});
