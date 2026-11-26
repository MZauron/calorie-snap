import { describe, expect, it } from "vitest";
import {
  addItem,
  applyChip,
  applyKcalNote,
  checkScanAllowed,
  estimateTotals,
  noteText,
  parseEstimate,
  readNote,
  removeItem,
  setPortion,
  snapPortion,
  stepPortion,
  swapItem,
  type Estimate,
} from "./estimate";

const pizzaReply = {
  name: "Margherita pizza, 2 slices",
  confidence: 0.87,
  items: [
    { name: "Thin-crust pizza", amount: "2 slices", kcal: 480, protein: 20, carbs: 56, fat: 17, swap: { name: "Regular-crust pizza", amount: "2 slices", kcal: 560, protein: 22, carbs: 70, fat: 19 } },
    { name: "Oil drizzle", amount: "1 tsp", kcal: 40, protein: 0, carbs: 0, fat: 4 },
  ],
};
const pizza = (): Estimate => {
  const r = parseEstimate(pizzaReply);
  if (!r.ok) throw new Error("fixture");
  return r.estimate;
};
const plain = (kcal: number): Estimate => {
  const r = parseEstimate({ name: "Meal", confidence: 0.9, items: [{ name: "Meal", kcal, protein: 10, carbs: 10, fat: 10 }] });
  if (!r.ok) throw new Error("fixture");
  return r.estimate;
};

describe("CS-14 the model's reply", () => {
  it("CS-14a a valid reply", () => {
    const e = pizza();
    expect(e.items).toHaveLength(2);
    expect(e.confidence).toBe(0.87);
    expect(e.lowConfidence).toBe(false);
    expect(estimateTotals(e).kcal).toBe(520);
  });
  it("CS-14b numbers are clamped", () => {
    const r = parseEstimate({ name: "x", confidence: 0.9, items: [{ name: "Huge", kcal: 4000, protein: 400, carbs: 10, fat: -5 }] });
    expect(r.ok && r.estimate.items[0]).toMatchObject({ kcal: 3000, protein: 300, fat: 0 });
  });
  it("CS-14c under 0.5 is low confidence", () => {
    const r = parseEstimate({ ...pizzaReply, confidence: 0.4 });
    expect(r.ok && r.estimate.lowConfidence).toBe(true);
  });
  it("CS-14d no items: no food found", () => {
    expect(parseEstimate({ name: "", confidence: 0.9, items: [] })).toEqual({ ok: false, code: "NO_FOOD_FOUND" });
  });
  it("CS-14e a reply of the wrong shape fails", () => {
    expect(parseEstimate("pizza")).toEqual({ ok: false, code: "ESTIMATE_FAILED" });
    expect(parseEstimate({ name: "x", confidence: 0.9, items: [{ name: "a" }] })).toEqual({ ok: false, code: "ESTIMATE_FAILED" });
    expect(parseEstimate({ name: "x", confidence: 0.9, items: [{ name: "a", kcal: "lots" }] })).toEqual({ ok: false, code: "ESTIMATE_FAILED" });
  });
  it("CS-14f a meal over 5000 kcal is scaled to 5000", () => {
    const r = parseEstimate({ name: "x", confidence: 0.9, items: [{ name: "a", kcal: 3000 }, { name: "b", kcal: 3000 }] });
    expect(r.ok && r.estimate.items.map((i) => i.kcal)).toEqual([2500, 2500]);
  });
  it("CS-14g the daily scan limit", () => {
    expect(checkScanAllowed(30, 30)).toEqual({ ok: false, errors: [{ code: "SCAN_LIMIT" }] });
    expect(checkScanAllowed(29, 30).ok).toBe(true);
  });
  it("CS-14h confidence is clamped to 0–1", () => {
    const high = parseEstimate({ ...pizzaReply, confidence: 1.7 });
    const low = parseEstimate({ ...pizzaReply, confidence: -1 });
    expect(high.ok && high.estimate.confidence).toBe(1);
    expect(low.ok && low.estimate).toMatchObject({ confidence: 0, lowConfidence: true });
  });
  it("CS-14i names are trimmed, cut to 80 and kept as plain text", () => {
    const markup = "<img src=x onerror=alert(1)>";
    const r = parseEstimate({ name: `  ${"a".repeat(90)}  `, confidence: 0.9, items: [{ name: `  Toast   with  jam `, kcal: 200 }, { name: markup, kcal: 1 }] });
    expect(r.ok && r.estimate.name).toBe("a".repeat(80));
    expect(r.ok && r.estimate.items.map((i) => i.name)).toEqual(["Toast with jam", markup]);
  });
});

describe("CS-15 corrections", () => {
  it("CS-15a Cooked in oil on the pizza: 640 kcal, fat 21 → 35 g", () => {
    const before = pizza();
    expect(estimateTotals(before)).toMatchObject({ kcal: 520, fat: 21 });
    const after = applyChip(before, "cooked_in_oil", "Cooked in oil");
    expect(estimateTotals(after)).toMatchObject({ kcal: 640, fat: 35 });
    expect(after.items.at(-1)).toMatchObject({ name: "Cooking oil", amount: "1 tbsp", kcal: 120, origin: "adjustment" });
    expect(noteText(after)).toBe("Cooked in oil");
  });
  it("CS-15b × removes an item", () => {
    const e = removeItem(pizza(), 1);
    expect(e.items).toHaveLength(1);
    expect(estimateTotals(e).kcal).toBe(480);
  });
  it("CS-15c Swap uses the model's alternative", () => {
    const e = swapItem(pizza(), 0);
    expect(e.items[0]).toMatchObject({ name: "Regular-crust pizza", kcal: 560, origin: "swap", swap: null });
    expect(estimateTotals(e).kcal).toBe(600);
  });
  it("CS-15d an add chip adds an item", () => {
    const e = addItem(pizza(), { name: "Cooking oil", amount: "1 tbsp", kcal: 120, protein: 0, carbs: 0, fat: 14 });
    expect(e.items.at(-1)!.origin).toBe("added");
    expect(estimateTotals(e).kcal).toBe(640);
  });
  it("CS-15e a typed +150 kcal", () => {
    expect(readNote("+150 kcal")).toEqual({ ok: true, note: { kind: "kcal", kcal: 150 } });
    expect(estimateTotals(applyKcalNote(pizza(), 150, "+150 kcal")).kcal).toBe(670);
  });
  it("CS-15f a typed −100 kcal never takes the meal below 0", () => {
    expect(readNote("−100 kcal")).toEqual({ ok: true, note: { kind: "kcal", kcal: -100 } });
    expect(readNote("-100")).toEqual({ ok: true, note: { kind: "kcal", kcal: -100 } });
    expect(estimateTotals(applyKcalNote(plain(50), -100, "-100")).kcal).toBe(0);
  });
  it("CS-15g other text goes to the model", () => {
    expect(readNote("  no rice ")).toEqual({ ok: true, note: { kind: "model", text: "no rice" } });
  });
  it("CS-15h portion steps of 0.25 from 0.25 to 3", () => {
    expect(stepPortion(1, 1)).toBe(1.25);
    expect(stepPortion(3, 1)).toBe(3);
    expect(stepPortion(0.25, -1)).toBe(0.25);
    expect(snapPortion(1.1)).toBe(1);
    expect(estimateTotals(setPortion(pizza(), 1.5)).kcal).toBe(780);
  });
  it("CS-15i every note chip", () => {
    const kcal = (id: Parameters<typeof applyChip>[1]) => estimateTotals(applyChip(plain(400), id, id)).kcal;
    expect(estimateTotals(applyChip(plain(400), "butter", "Butter"))).toMatchObject({ kcal: 500, fat: 21 });
    expect(kcal("extra_cheese")).toBe(510);
    expect(kcal("extra_sauce")).toBe(460);
    expect(kcal("bigger_portion")).toBe(500);
    expect(kcal("smaller_portion")).toBe(300);
    expect(kcal("didnt_finish")).toBe(300);
  });
  it("CS-15j a chip counts once", () => {
    const once = applyChip(pizza(), "cooked_in_oil", "Cooked in oil");
    const twice = applyChip(once, "cooked_in_oil", "Cooked in oil");
    expect(twice).toBe(once);
    expect(estimateTotals(twice).kcal).toBe(640);
  });
  it("CS-15k notes that can't be used", () => {
    for (const note of ["", "   ", "x".repeat(201), "+0 kcal"]) expect(readNote(note)).toEqual({ ok: false, code: "NOTE_NOT_UNDERSTOOD" });
  });
  it("CS-15l typed kcal are not scaled by the portion", () => {
    expect(estimateTotals(setPortion(applyKcalNote(plain(400), 150, "+150 kcal"), 2)).kcal).toBe(950);
  });
});
