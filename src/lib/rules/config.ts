// Every number and threshold the rules use (docs/DESIGN.md "Rules"). Change them here only.
import type { Activity, MealType, Pace, Sex } from "./types";

/** CS-02: Mifflin–St Jeor activity factors. */
export const ACTIVITY_FACTOR: Record<Activity, number> = { light: 1.375, moderate: 1.55, active: 1.725 };
/** CS-02: the sex term of the BMR. */
export const BMR_SEX_TERM: Record<Sex, number> = { male: 5, female: -161 };

/** CS-10: 7,700 kcal ≈ 1 kg of body fat. */
export const KCAL_PER_KG = 7700;

/** CS-05: the safe minimum daily limit (Q5 default: 1200 for women). */
export const SAFE_MINIMUM_KCAL: Record<Sex, number> = { male: 1500, female: 1200 };

/** CS-04: the pace options and the cap (about 1% of the current weight a week, rounded down to 0.05 kg). */
export const PACE_OPTIONS: readonly Pace[] = [0.25, 0.5, 0.75, 1];
export const DEFAULT_PACE: Pace = 0.5;
export const PACE_CAP_SHARE = 0.01;
export const PACE_CAP_STEP_KG = 0.05;

/** CS-03 (Q6 default): the goal must be at a BMI of at least this, and at least this much below the current weight. */
export const MIN_GOAL_BMI = 18.5;
export const MIN_GOAL_LOSS_KG = 1;

/** CS-03 input ranges (also the database constraints in docs/schema.sql). */
export const RANGES = {
  ageYears: { min: 18, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 300 },
} as const;

/** CS-06 (Q4 default): grams per kg of current weight; carbs are what is left of the limit. */
export const PROTEIN_G_PER_KG = 1.6;
export const FAT_G_PER_KG = 0.8;
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;
/** Q10 default: carbs and fat are "on target" within 10% of the target. */
export const MACRO_ON_TARGET_SHARE = 0.1;

/** CS-09: the protein tip shows when at least this much protein is left. */
export const PROTEIN_TIP_MIN_G = 15;

/** CS-11 (Q14 default): within this many kg of the plan line is "On plan". */
export const ON_PLAN_KG = 0.5;

/** CS-10: "Last N full days" looks back this many days (today is never full). */
export const FULL_DAYS_WINDOW = 7;

/** CS-14: limits on a photo estimate (model output is clamped to these). */
export const ESTIMATE_LIMITS = {
  itemKcal: 3000,
  itemMacroG: 300,
  mealKcal: 5000,
  items: 50,
  lowConfidence: 0.5,
  nameLength: 80,
  amountLength: 40,
} as const;
/** Q8 default: photo estimates per person per day (`SCANS_PER_DAY` overrides it). */
export const DEFAULT_SCANS_PER_DAY = 30;

/** CS-15: portion steps. */
export const PORTION = { min: 0.25, max: 3, step: 0.25 } as const;
/** CS-15: a typed "+N kcal" note is applied directly up to this size. */
export const NOTE_MAX_KCAL = 3000;
export const NOTE_MAX_LENGTH = 200;

/** CS-16 (Q15 default): meal type by local time, minutes since midnight, [from, to). Anything else is a snack. */
export const MEAL_TIMES: { type: Exclude<MealType, "snack">; from: number; to: number }[] = [
  { type: "breakfast", from: 4 * 60, to: 11 * 60 },
  { type: "lunch", from: 11 * 60, to: 15 * 60 },
  { type: "dinner", from: 17 * 60, to: 21 * 60 + 30 },
];

/** CS-18: the food list. */
export const FOOD_NAME_MAX = 40;
export const FOOD_LIST_MAX = 100;

/** CS-19: meals. */
export const MEAL_LIMITS = { nameMax: 80, kcalMax: 5000, macroMaxG: 500, quickAddMinKcal: 1 } as const;
/** Q18 default: meals of today and the past 7 days can be edited. */
export const MEAL_EDIT_DAYS = 7;

/** CS-20: BMI range names (upper bounds, exclusive). */
export const BMI_RANGES = [
  { range: "underweight", below: 18.5 },
  { range: "healthy", below: 25 },
  { range: "overweight", below: 30 },
  { range: "obesity", below: Infinity },
] as const;

/** CS-20: words never used in the app's copy. */
export const BANNED_WORDS = ["cheat", "cheated", "cheating", "bad", "guilt", "guilty", "fail", "failed", "failure", "punish", "punishment"] as const;

/** Used when a profile has no zone yet (the browser sets the real one). */
export const DEFAULT_TIMEZONE = "America/Toronto";

/** The note-chip adjustments (CS-15, Q16) live in the catalogue; re-exported so the rules have one place to read config. */
export { ADJUSTMENTS, ADJUSTMENT_IDS } from "@/lib/catalog/adjustments";

// ---------------------------------------------------------------------------
// Rounding (happens once, in the rules): kcal to 10, protein and fat to 5 g, weights to 0.1 kg.
// ---------------------------------------------------------------------------
const decimals = (step: number) => (Number.isInteger(step) ? 0 : (String(step).split(".")[1]?.length ?? 0));
/** Rounds to the nearest multiple of `step` (halves away from zero), without binary-fraction noise (6.8 not 6.7999…). */
export function roundTo(value: number, step: number): number {
  const scaled = value / step;
  const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled) + 1e-9);
  return Number((rounded * step).toFixed(decimals(step)));
}
export function floorTo(value: number, step: number): number {
  return Number((Math.floor(value / step + 1e-9) * step).toFixed(decimals(step)));
}
export function ceilTo(value: number, step: number): number {
  return Number((Math.ceil(value / step - 1e-9) * step).toFixed(decimals(step)));
}
export const roundKcal = (kcal: number) => roundTo(kcal, 10);
export const roundGrams5 = (g: number) => roundTo(g, 5);
export const roundKg = (kg: number) => roundTo(kg, 0.1);
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
