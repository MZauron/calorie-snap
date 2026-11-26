import { describe, expect, it } from "vitest";
import { canEditMeal, checkMeal, type MealInput } from "./meals";

const pizza: MealInput = { name: "Pizza", kcal: 640, protein: 25, carbs: 60, fat: 35, portion: 1.25, source: "photo" };
const fields = (m: MealInput) => checkMeal(m).errors.map((e) => `${e.code}:${e.field}`);

describe("CS-19 meals", () => {
  it("CS-19a a valid meal", () => {
    expect(checkMeal(pizza)).toEqual({ ok: true, errors: [] });
  });
  it("CS-19b at most 5000 kcal", () => {
    expect(fields({ ...pizza, kcal: 5001 })).toEqual(["MEAL_INVALID:kcal"]);
  });
  it("CS-19c quick add needs at least 1 kcal", () => {
    expect(fields({ ...pizza, kcal: 0, source: "quick_add" })).toEqual(["MEAL_INVALID:kcal"]);
    expect(checkMeal({ ...pizza, kcal: 0, source: "search" }).ok).toBe(true);
  });
  it("CS-19d a name of 1–80 characters", () => {
    expect(fields({ ...pizza, name: "  " })).toEqual(["MEAL_INVALID:name"]);
    expect(fields({ ...pizza, name: "x".repeat(81) })).toEqual(["MEAL_INVALID:name"]);
  });
  it("CS-19e portions in quarter steps up to 3", () => {
    expect(fields({ ...pizza, portion: 1.1 })).toEqual(["MEAL_INVALID:portion"]);
    expect(fields({ ...pizza, portion: 3.25 })).toEqual(["MEAL_INVALID:portion"]);
  });
  it("CS-19f macros of 0–500 g", () => {
    expect(fields({ ...pizza, protein: 501 })).toEqual(["MEAL_INVALID:protein"]);
    expect(fields({ ...pizza, fat: -1 })).toEqual(["MEAL_INVALID:fat"]);
  });
  it("CS-19g meals of today and the past 7 days can be edited", () => {
    const today = "2026-11-24";
    expect(["2026-11-24", "2026-11-17", "2026-11-16", "2026-11-25"].map((d) => canEditMeal(d, today))).toEqual([true, true, false, false]);
  });
});
