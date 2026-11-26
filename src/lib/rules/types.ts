// Shared types of the rules (docs/DESIGN.md "Rules"). Pure: no I/O, no clock.

/** Stable error codes. The copy for each lives in src/lib/i18n/en-CA.ts (`errors`). */
export const ERROR_CODES = [
  "NOT_ELIGIBLE",
  "AGE_UNDER_18",
  "PROFILE_INCOMPLETE",
  "GOAL_NOT_BELOW",
  "GOAL_TOO_LOW",
  "OUT_OF_RANGE",
  "NO_FOOD_FOUND",
  "SCAN_LIMIT",
  "ESTIMATE_FAILED",
  "NOTE_NOT_UNDERSTOOD",
  "FOOD_EMPTY",
  "FOOD_DUPLICATE",
  "FOOD_LIST_FULL",
  "MEAL_INVALID",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export type RuleError = { code: ErrorCode; field?: string };
export type Decision = { ok: boolean; errors: RuleError[] };

export const allow = (): Decision => ({ ok: true, errors: [] });
export const refuse = (...errors: RuleError[]): Decision => ({ ok: false, errors });
export const decide = (errors: RuleError[]): Decision => ({ ok: errors.length === 0, errors });

/** A calendar day, `YYYY-MM-DD`, in the user's zone. */
export type IsoDate = string;

export type Sex = "female" | "male";
export type Activity = "light" | "moderate" | "active";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type Pace = 0.25 | 0.5 | 0.75 | 1;
export type Macros = { protein: number; carbs: number; fat: number };
