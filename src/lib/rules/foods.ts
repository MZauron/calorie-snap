// The food list (CS-18). Pure.
import { FOOD_LIST_MAX, FOOD_NAME_MAX } from "./config";
import { decide, type Decision, type RuleError } from "./types";

/** Trimmed, inner spaces collapsed ("  Greek   yogurt " → "Greek yogurt"). */
export const cleanFoodName = (raw: string) => raw.replace(/\s+/g, " ").trim();

const same = (a: string, b: string) => a.localeCompare(b, "en-CA", { sensitivity: "accent" }) === 0;

/** CS-18: may this food be added to a list that already has `existing`? 1–40 characters, case-insensitive unique, ≤ 100 foods. */
export function checkNewFood(raw: string, existing: readonly string[]): Decision {
  const name = cleanFoodName(raw);
  const errors: RuleError[] = [];
  if (name.length === 0) errors.push({ code: "FOOD_EMPTY", field: "name" });
  else if (name.length > FOOD_NAME_MAX) errors.push({ code: "OUT_OF_RANGE", field: "name" });
  else if (existing.some((e) => same(e, name))) errors.push({ code: "FOOD_DUPLICATE", field: "name" });
  else if (existing.length >= FOOD_LIST_MAX) errors.push({ code: "FOOD_LIST_FULL" });
  return decide(errors);
}

/** CS-18: the "Or tap to add" chips: the suggestions in order, without those on the list, the first `shown`. */
export function quickChips(suggestions: readonly string[], list: readonly string[], shown: number): string[] {
  return suggestions.filter((s) => !list.some((f) => same(f, s))).slice(0, shown);
}
