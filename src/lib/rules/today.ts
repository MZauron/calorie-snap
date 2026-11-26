// Today: the ring card, macros and the protein tip, and the meal type of a new meal (CS-08, 09, 16; Q10). Pure.
import { MACRO_ON_TARGET_SHARE, MEAL_TIMES, PROTEIN_TIP_MIN_G, roundTo } from "./config";
import { localMinutes } from "./time";
import type { Macros, MealType } from "./types";

export type TodaySummary = {
  eaten: number;
  /** limit − eaten; negative when over. */
  left: number;
  /** "N kcal over" (ring full, amber); 0 when not over. */
  over: number;
  /** burn − eaten. */
  deficitSoFar: number;
  /** burn − limit: "Ends near N if you eat to your limit". */
  endsNear: number;
};

/** CS-08: the ring card. `eaten` is the sum of today's meals (local_date = today in the user's zone). */
export function todaySummary(input: { limit: number; burn: number; eaten: number }): TodaySummary {
  const left = input.limit - input.eaten;
  return { eaten: input.eaten, left, over: Math.max(0, -left), deficitSoFar: input.burn - input.eaten, endsNear: input.burn - input.limit };
}

export type ProteinProgress = { target: number; eaten: number; toGo: number; met: boolean };
export type TargetState = "to_go" | "on_target" | "over";
export type TargetProgress = { target: number; eaten: number; state: TargetState; toGo: number; over: number };

/**
 * CS-06 / Q10 default: protein is a minimum ("64 g to go" / "goal met"); carbs and fat are targets: "N g to go", "on target"
 * within 10% of the target, "N g over" above that (never red).
 */
export function macroProgress(targets: Macros, eaten: Macros): { protein: ProteinProgress; carbs: TargetProgress; fat: TargetProgress } {
  const g = (n: number) => roundTo(n, 1);
  const proteinToGo = Math.max(0, g(targets.protein - eaten.protein));
  const target = (t: number, e: number): TargetProgress => {
    const band = t * MACRO_ON_TARGET_SHARE;
    const diff = e - t;
    const state: TargetState = Math.abs(diff) <= band ? "on_target" : diff < 0 ? "to_go" : "over";
    return { target: t, eaten: g(e), state, toGo: state === "to_go" ? g(-diff) : 0, over: state === "over" ? g(diff) : 0 };
  };
  return {
    protein: { target: targets.protein, eaten: g(eaten.protein), toGo: proteinToGo, met: proteinToGo === 0 },
    carbs: target(targets.carbs, eaten.carbs),
    fat: target(targets.fat, eaten.fat),
  };
}

/** CS-09: "You still need {g} g protein in {kcal} kcal…", or nothing. */
export function proteinTip(input: { proteinLeft: number; kcalLeft: number }): { grams: number; kcal: number } | null {
  if (input.proteinLeft < PROTEIN_TIP_MIN_G || input.kcalLeft <= 0) return null;
  return { grams: Math.round(input.proteinLeft), kcal: input.kcalLeft };
}

/** CS-16 (Q15 default): the meal type pre-selected for a meal added at `instant`, by the local time in `zone`. */
export function mealTypeAt(instant: Date, zone: string): MealType {
  const minutes = localMinutes(instant, zone);
  return MEAL_TIMES.find((t) => minutes >= t.from && minutes < t.to)?.type ?? "snack";
}
