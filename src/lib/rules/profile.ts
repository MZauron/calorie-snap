// CS-01 (eligibility) and CS-03 (inputs and the goal). Pure.
import { MIN_GOAL_BMI, MIN_GOAL_LOSS_KG, RANGES, ceilTo, roundTo } from "./config";
import { decide, type Activity, type Decision, type Pace, type RuleError, type Sex } from "./types";

/** What Profile sends: every field may still be empty while the person types. */
export type ProfileDraft = {
  sex?: Sex | null;
  ageYears?: number | null;
  heightCm?: number | null;
  startWeightKg?: number | null;
  activity?: Activity | null;
  goalWeightKg?: number | null;
  pace?: Pace | null;
};

/** CS-01: the one checkbox on Start ("For adults 18+. Not for use during pregnancy or breastfeeding."). */
export function checkEligibility(confirmed: boolean): Decision {
  return decide(confirmed ? [] : [{ code: "NOT_ELIGIBLE", field: "eligible" }]);
}

const outside = (value: number, range: { min: number; max: number }) => !Number.isFinite(value) || value < range.min || value > range.max;

/** CS-20/CS-03: body-mass index, unrounded. */
export const bmiOf = (kg: number, cm: number) => kg / (cm / 100) ** 2;

/** CS-03 (Q6 default): the lowest goal allowed for a height, rounded up to 0.1 kg so it is itself allowed. */
export const lowestGoalKg = (heightCm: number) => ceilTo(MIN_GOAL_BMI * (heightCm / 100) ** 2, 0.1);

/**
 * CS-01 + CS-03: may this profile be saved? Empty fields are fine (the person is still typing); a value that is there must be
 * in range. A goal needs the eligibility confirmation, a height, and must be at least 1 kg below the current weight (the latest
 * check-in, else the start weight) and at a BMI of 18.5 or more.
 */
export function validateProfile(draft: ProfileDraft, context: { eligibleConfirmed: boolean; latestCheckInKg?: number | null }): Decision {
  const errors: RuleError[] = [];
  const { ageYears, heightCm, startWeightKg, goalWeightKg } = draft;

  if (ageYears != null) {
    if (Number.isFinite(ageYears) && ageYears < RANGES.ageYears.min) errors.push({ code: "AGE_UNDER_18", field: "ageYears" });
    else if (outside(ageYears, RANGES.ageYears) || !Number.isInteger(ageYears)) errors.push({ code: "OUT_OF_RANGE", field: "ageYears" });
  }
  if (heightCm != null && outside(heightCm, RANGES.heightCm)) errors.push({ code: "OUT_OF_RANGE", field: "heightCm" });
  if (startWeightKg != null && outside(startWeightKg, RANGES.weightKg)) errors.push({ code: "OUT_OF_RANGE", field: "startWeightKg" });

  if (goalWeightKg != null) {
    if (!context.eligibleConfirmed) errors.push({ code: "NOT_ELIGIBLE", field: "eligible" });
    if (outside(goalWeightKg, RANGES.weightKg)) {
      errors.push({ code: "OUT_OF_RANGE", field: "goalWeightKg" });
    } else {
      const current = context.latestCheckInKg ?? startWeightKg;
      if (current != null && roundTo(current - goalWeightKg, 0.1) < MIN_GOAL_LOSS_KG) errors.push({ code: "GOAL_NOT_BELOW", field: "goalWeightKg" });
      else if (heightCm != null && !outside(heightCm, RANGES.heightCm) && goalWeightKg < lowestGoalKg(heightCm)) {
        errors.push({ code: "GOAL_TOO_LOW", field: "goalWeightKg" });
      }
    }
  }
  return decide(errors);
}
