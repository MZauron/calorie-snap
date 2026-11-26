// Meals (CS-19; Q18). Pure.
import { MEAL_EDIT_DAYS, MEAL_LIMITS, PORTION } from "./config";
import { daysBetween } from "./time";
import { decide, type Decision, type IsoDate, type RuleError } from "./types";

export type MealSource = "photo" | "search" | "recent" | "quick_add" | "idea";
export type MealInput = {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: number;
  source: MealSource;
};

const bad = (field: string): RuleError => ({ code: "MEAL_INVALID", field });

/** CS-19: name 1–80, kcal 0–5000 (quick add ≥ 1), macros 0–500 g, portion 0.25–3 in steps of 0.25. */
export function checkMeal(meal: MealInput): Decision {
  const errors: RuleError[] = [];
  const name = meal.name.replace(/\s+/g, " ").trim();
  if (name.length === 0 || name.length > MEAL_LIMITS.nameMax) errors.push(bad("name"));
  const minKcal = meal.source === "quick_add" ? MEAL_LIMITS.quickAddMinKcal : 0;
  if (!Number.isInteger(meal.kcal) || meal.kcal < minKcal || meal.kcal > MEAL_LIMITS.kcalMax) errors.push(bad("kcal"));
  for (const field of ["protein", "carbs", "fat"] as const) {
    const g = meal[field];
    if (!Number.isFinite(g) || g < 0 || g > MEAL_LIMITS.macroMaxG) errors.push(bad(field));
  }
  const p = meal.portion;
  if (!Number.isFinite(p) || p < PORTION.min || p > PORTION.max || Math.abs(p / PORTION.step - Math.round(p / PORTION.step)) > 1e-9) {
    errors.push(bad("portion"));
  }
  return decide(errors);
}

/** Q18 default: a meal of today or the past 7 days can be edited (portion, meal type); never a future day. */
export function canEditMeal(mealDate: IsoDate, today: IsoDate): boolean {
  const age = daysBetween(mealDate, today);
  return age >= 0 && age <= MEAL_EDIT_DAYS;
}
