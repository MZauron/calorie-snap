import { describe, expect, it } from "vitest";
import { enCA } from "@/lib/i18n/en-CA";
import { bannedWordsIn, bmi, mayEncourage } from "./tone";

/** Every string in a nested copy object (functions are formatters, not copy). */
function strings(value: unknown, path = "enCA"): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => strings(v, `${path}.${k}`));
  return [];
}

describe("CS-20 tone and BMI", () => {
  it("CS-20a est. 81.8 kg at 178 cm: BMI 25.8, overweight", () => {
    expect(bmi(81.8, 178)).toEqual({ value: 25.8, range: "overweight" });
  });
  it("CS-20b the range boundaries", () => {
    expect([18.4, 18.5, 24.9, 25, 29.9, 30].map((kg) => bmi(kg, 100).range)).toEqual([
      "underweight",
      "healthy",
      "healthy",
      "overweight",
      "overweight",
      "obesity",
    ]);
  });
  it("CS-20c banned words are found as whole words only", () => {
    expect(bannedWordsIn("Cheat day")).toEqual(["cheat"]);
    expect(bannedWordsIn("a bad day")).toEqual(["bad"]);
    expect(bannedWordsIn("You failed")).toEqual(["failed"]);
    expect(bannedWordsIn("Feeling guilty?")).toEqual(["guilty"]);
    expect(bannedWordsIn("don't punish yourself")).toEqual(["punish"]);
    expect(bannedWordsIn("A new badge! Thanks for the feedback.")).toEqual([]);
  });
  it("CS-20d no string in en-CA.ts uses a banned word", () => {
    const found = strings(enCA).flatMap(([path, text]) => bannedWordsIn(text).map((w) => `${path}: ${w}`));
    expect(strings(enCA).length).toBeGreaterThan(10);
    expect(found).toEqual([]);
  });
  it("CS-20e no encouragement on a Too low day", () => {
    expect(mayEncourage("too_low")).toBe(false);
    expect(mayEncourage("under")).toBe(true);
  });
});
