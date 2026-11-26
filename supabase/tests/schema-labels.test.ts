// From MZauron/playdate supabase/tests/schema-labels.test.ts @ eeb9dd8 (expect_ok checks counted too).
// Needs no database: every check in docs/schema.test.sql has a test of the same name in schema.test.ts, and the reverse.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "../..");
const sql = readFileSync(path.join(root, "docs/schema.test.sql"), "utf8");
const sqlLabels = [...sql.matchAll(/^select expect_(?:error|count|ok)\(([\s\S]*?)\);$/gm)].map((m) => {
  const label = /'((?:[^']|'')+)'$/.exec(m[1]!);
  if (!label) throw new Error(`No label in: ${m[0].slice(0, 80)}`);
  return label[1]!.replace(/''/g, "'");
});
const testNames = [...readFileSync(path.join(import.meta.dirname, "schema.test.ts"), "utf8").matchAll(/\bit\(\s*"([^"]+)"/g)].map((m) => m[1]!);

describe("docs/schema.test.sql ↔ supabase/tests/schema.test.ts", () => {
  it("finds the 51 checks", () => {
    expect(sqlLabels).toHaveLength(51);
  });
  it("every check has a test", () => {
    expect(sqlLabels.filter((l) => !testNames.includes(l))).toEqual([]);
  });
  it("every test is a check", () => {
    expect(testNames.filter((n) => !sqlLabels.includes(n))).toEqual([]);
  });
});
