// All the maths: burn, pace cap, daily limit, macros, timeline, estimated weight, plan line, difference, projection
// (CS-02, 04, 05, 06, 07, 11). Pages, server actions and the demo call these and show the results exactly as computed.
import {
  ACTIVITY_FACTOR,
  BMR_SEX_TERM,
  FAT_G_PER_KG,
  KCAL_PER_G,
  KCAL_PER_KG,
  ON_PLAN_KG,
  PACE_CAP_SHARE,
  PACE_CAP_STEP_KG,
  PROTEIN_G_PER_KG,
  SAFE_MINIMUM_KCAL,
  floorTo,
  roundGrams5,
  roundKcal,
  roundKg,
  roundTo,
} from "./config";
import { addDays, daysBetween, wholeYearsBetween } from "./time";
import { decide, type Activity, type Decision, type IsoDate, type Pace, type RuleError, type Sex } from "./types";

// ---------------------------------------------------------------------------
// CS-02 Burn
// ---------------------------------------------------------------------------

/** CS-02: the age today, from the age entered and whole years since it was entered. */
export const ageOn = (ageYears: number, recordedOn: IsoDate, today: IsoDate) => ageYears + Math.max(0, wholeYearsBetween(recordedOn, today));

/** CS-02: the weight burn, protein, fat and the pace cap use: the latest check-in, else the start weight. */
export const currentWeightKg = (startWeightKg: number, latestCheckInKg?: number | null) => latestCheckInKg ?? startWeightKg;

/** Mifflin–St Jeor BMR, unrounded. */
export const bmr = (sex: Sex, kg: number, cm: number, age: number) => 10 * kg + 6.25 * cm - 5 * age + BMR_SEX_TERM[sex];

/** CS-02: what the body burns a day ("You burn"), rounded to 10 kcal. */
export const burnKcal = (input: { sex: Sex; weightKg: number; heightCm: number; age: number; activity: Activity }) =>
  roundKcal(bmr(input.sex, input.weightKg, input.heightCm, input.age) * ACTIVITY_FACTOR[input.activity]);

// ---------------------------------------------------------------------------
// CS-04 Pace and CS-05 the daily limit
// ---------------------------------------------------------------------------

/** CS-04: the fastest pace allowed, about 1% of the current weight a week, rounded down to 0.05 kg. */
export const paceCapKg = (currentKg: number) => floorTo(currentKg * PACE_CAP_SHARE, PACE_CAP_STEP_KG);

/** kcal a day for a pace in kg a week (7,700 kcal ≈ 1 kg). */
export const deficitForPace = (paceKgWeek: number) => (paceKgWeek * KCAL_PER_KG) / 7;
/** kg a week for a daily deficit. */
export const paceForDeficit = (deficitKcal: number) => (deficitKcal * 7) / KCAL_PER_KG;

export type DailyNumbers = {
  burn: number;
  /** The pace chosen on Profile. */
  chosenPace: Pace;
  /** CS-04: the cap for this person. */
  paceCap: number;
  /** CS-04: the chosen pace was above the cap (the ⚠ line). */
  paceCapped: boolean;
  /** The pace planned with: the chosen pace or the cap, whichever is lower. */
  plannedPace: number;
  /** CS-05: "Eat up to". Never below `minimum`. */
  limit: number;
  minimum: number;
  /** CS-05: the minimum raised the limit; the shown pace and timeline use the real deficit. */
  minimumBinds: boolean;
  /** burn − limit: "That's a N kcal daily deficit". */
  deficit: number;
  /** kg a week the limit really gives (= plannedPace unless the minimum binds), to 0.01. */
  effectivePace: number;
  /** CS-06 targets, grams a day. */
  protein: number;
  fat: number;
  carbs: number;
};

export type DailyNumbersInput = { sex: Sex; age: number; heightCm: number; currentKg: number; activity: Activity; pace: Pace };

/** CS-02, 04, 05, 06: the dark "Your daily numbers" card. */
export function dailyNumbers(input: DailyNumbersInput): DailyNumbers {
  const burn = burnKcal({ sex: input.sex, weightKg: input.currentKg, heightCm: input.heightCm, age: input.age, activity: input.activity });
  const paceCap = paceCapKg(input.currentKg);
  const paceCapped = input.pace > paceCap;
  const plannedPace = paceCapped ? paceCap : input.pace;
  const minimum = SAFE_MINIMUM_KCAL[input.sex];
  const planned = roundKcal(burn - deficitForPace(plannedPace));
  const limit = Math.max(planned, minimum);
  const deficit = burn - limit;
  return {
    burn,
    chosenPace: input.pace,
    paceCap,
    paceCapped,
    plannedPace,
    limit,
    minimum,
    minimumBinds: planned < minimum,
    deficit,
    effectivePace: roundTo(paceForDeficit(deficit), 0.01),
    ...macroTargets(input.currentKg, limit),
  };
}

/** CS-06 (Q4 default): protein 1.6 g/kg and fat 0.8 g/kg (to 5 g); carbs take what's left of the limit (to 5 g, never below 0). */
export function macroTargets(currentKg: number, limitKcal: number): { protein: number; fat: number; carbs: number } {
  const protein = roundGrams5(PROTEIN_G_PER_KG * currentKg);
  const fat = roundGrams5(FAT_G_PER_KG * currentKg);
  const rest = limitKcal - protein * KCAL_PER_G.protein - fat * KCAL_PER_G.fat;
  return { protein, fat, carbs: Math.max(0, roundGrams5(rest / KCAL_PER_G.carbs)) };
}

/** CS-02: are the fields the daily numbers need all there? */
export function checkComplete(profile: {
  sex?: Sex | null;
  ageYears?: number | null;
  heightCm?: number | null;
  startWeightKg?: number | null;
  activity?: Activity | null;
}): Decision {
  const errors: RuleError[] = [];
  for (const field of ["sex", "ageYears", "heightCm", "startWeightKg", "activity"] as const) {
    if (profile[field] == null) errors.push({ code: "PROFILE_INCOMPLETE", field });
  }
  return decide(errors);
}

// ---------------------------------------------------------------------------
// CS-07 Timeline and CS-11 projection
// ---------------------------------------------------------------------------

export type Timeline = {
  /** Estimated weight − goal, to 0.1 kg (0 once the goal is reached). */
  toLoseKg: number;
  /** One decimal ("about 8.5 weeks"). */
  weeks: number;
  /** today + ⌈weeks × 7⌉ days. */
  date: IsoDate;
  reached: boolean;
};

/**
 * CS-07 / CS-11 projection: from the estimated weight to the goal at the real daily deficit (burn − limit, so a binding
 * minimum is already in it). `deficitKcal` must be above 0.
 */
export function timeline(input: { estimatedKg: number; goalKg: number; deficitKcal: number; today: IsoDate }): Timeline {
  const toLoseKg = Math.max(0, roundKg(input.estimatedKg - input.goalKg));
  if (toLoseKg === 0 || input.deficitKcal <= 0) return { toLoseKg, weeks: 0, date: input.today, reached: toLoseKg === 0 };
  const weeks = roundTo((toLoseKg * KCAL_PER_KG) / (input.deficitKcal * 7), 0.1);
  return { toLoseKg, weeks, date: addDays(input.today, Math.ceil(weeks * 7 - 1e-9)), reached: false };
}

// ---------------------------------------------------------------------------
// CS-11 Estimated weight, plan line, difference, % of the way
// ---------------------------------------------------------------------------

export type Anchor = { date: IsoDate; kg: number };
export type LoggedDay = { date: IsoDate; deficit: number };

/**
 * CS-11: "Now (est.)" = the latest check-in (else the start weight on the start date) − the deficits of the logged days from
 * that day on, ÷ 7,700, to 0.1 kg. Only logged days are passed in (Q13: an empty day counts nothing). Today is still going,
 * so only completed days (before `today`) count.
 */
export function estimatedWeightKg(anchor: Anchor, days: LoggedDay[], today: IsoDate): number {
  const total = days.filter((d) => d.date >= anchor.date && d.date < today).reduce((sum, d) => sum + d.deficit, 0);
  return roundKg(anchor.kg - total / KCAL_PER_KG);
}

/** CS-11: the dashed Plan line on a date: start − pace × weeks since the start, never below the goal. */
export function planWeightKg(input: { startKg: number; startDate: IsoDate; paceKgWeek: number; goalKg: number; on: IsoDate }): number {
  const weeks = Math.max(0, daysBetween(input.startDate, input.on)) / 7;
  return roundKg(Math.max(input.goalKg, input.startKg - input.paceKgWeek * weeks));
}

export type PlanStatus = "on_plan" | "ahead" | "behind";
/** CS-11 (Q14 default): estimated − plan within ±0.5 kg is On plan; lower is Ahead, higher Behind. */
export function planDifference(estimatedKg: number, planKg: number): { differenceKg: number; status: PlanStatus } {
  const differenceKg = roundKg(estimatedKg - planKg);
  const status: PlanStatus = Math.abs(differenceKg) <= ON_PLAN_KG ? "on_plan" : differenceKg < 0 ? "ahead" : "behind";
  return { differenceKg, status };
}

/** CS-11: "% of the way" (0–100, whole) and "about N kg to go". */
export function progressToGoal(input: { startKg: number; estimatedKg: number; goalKg: number }): { percent: number; toGoKg: number } {
  const span = input.startKg - input.goalKg;
  const done = input.startKg - input.estimatedKg;
  const percent = span <= 0 ? 100 : Math.round(Math.min(1, Math.max(0, done / span)) * 100);
  return { percent, toGoKg: Math.max(0, roundKg(input.estimatedKg - input.goalKg)) };
}

/** CS-11 Projection card: the average daily deficit over logged days ("So far you have averaged a N kcal daily deficit"). */
export function averageDeficit(days: LoggedDay[]): number | null {
  if (days.length === 0) return null;
  return Math.round(days.reduce((sum, d) => sum + d.deficit, 0) / days.length);
}
