import { describe, expect, it } from "vitest";
import { QUICK_FOODS, QUICK_FOODS_SHOWN } from "@/lib/catalog/quick-foods";
import { checkNewFood, cleanFoodName, quickChips } from "./foods";

describe("CS-18 food list", () => {
  it("CS-18a add to an empty list", () => {
    expect(checkNewFood("Chicken", [])).toEqual({ ok: true, errors: [] });
  });
  it("CS-18b a duplicate in another case", () => {
    expect(checkNewFood("chicken", ["Chicken"]).errors).toEqual([{ code: "FOOD_DUPLICATE", field: "name" }]);
  });
  it("CS-18c an empty name", () => {
    expect(checkNewFood("   ", []).errors).toEqual([{ code: "FOOD_EMPTY", field: "name" }]);
  });
  it("CS-18d the list is full at 100", () => {
    const list = Array.from({ length: 100 }, (_, i) => `Food ${i}`);
    expect(checkNewFood("Jam", list).errors).toEqual([{ code: "FOOD_LIST_FULL" }]);
  });
  it("CS-18e a name over 40 characters", () => {
    expect(checkNewFood("x".repeat(41), []).errors).toEqual([{ code: "OUT_OF_RANGE", field: "name" }]);
    expect(checkNewFood("x".repeat(40), []).ok).toBe(true);
  });
  it("CS-18f the quick chips hide chosen foods and refill", () => {
    const withChicken = quickChips(QUICK_FOODS, ["chicken"], QUICK_FOODS_SHOWN);
    expect(withChicken).toHaveLength(16);
    expect([withChicken[0], withChicken.at(-1)]).toEqual(["Eggs", "Cheese"]);
    const none = quickChips(QUICK_FOODS, [], QUICK_FOODS_SHOWN);
    expect([none[0], none.at(-1)]).toEqual(["Chicken", "Greek yogurt"]);
  });
  it("CS-18g names are trimmed", () => {
    expect(cleanFoodName("  Greek   yogurt ")).toBe("Greek yogurt");
  });
});
