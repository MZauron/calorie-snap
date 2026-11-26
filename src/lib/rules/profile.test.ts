import { describe, expect, it } from "vitest";
import { checkEligibility, lowestGoalKg, validateProfile, type ProfileDraft } from "./profile";

const alex: ProfileDraft = { sex: "male", ageYears: 42, heightCm: 178, startWeightKg: 92, activity: "moderate", pace: 0.5 };
const eligible = { eligibleConfirmed: true };
const codes = (d: ReturnType<typeof validateProfile>) => d.errors.map((e) => `${e.code}:${e.field ?? ""}`);

describe("CS-01 eligibility", () => {
  it("CS-01a a goal needs the eligibility confirmation", () => {
    const d = validateProfile({ ...alex, goalWeightKg: 82 }, { eligibleConfirmed: false });
    expect(d.ok).toBe(false);
    expect(codes(d)).toContain("NOT_ELIGIBLE:eligible");
  });
  it("CS-01b age 17 is refused", () => {
    expect(codes(validateProfile({ ...alex, ageYears: 17 }, eligible))).toEqual(["AGE_UNDER_18:ageYears"]);
  });
  it("CS-01c the Start checkbox", () => {
    expect(checkEligibility(false)).toEqual({ ok: false, errors: [{ code: "NOT_ELIGIBLE", field: "eligible" }] });
    expect(checkEligibility(true)).toEqual({ ok: true, errors: [] });
  });
  it("CS-01d an 18-year-old with a valid goal is fine", () => {
    expect(validateProfile({ ...alex, ageYears: 18, goalWeightKg: 82 }, eligible)).toEqual({ ok: true, errors: [] });
  });
});

describe("CS-03 inputs and the goal", () => {
  it("CS-03a the goal must be at least 1 kg below the current weight", () => {
    expect(codes(validateProfile({ ...alex, goalWeightKg: 91.5 }, eligible))).toEqual(["GOAL_NOT_BELOW:goalWeightKg"]);
  });
  it("CS-03b a goal under BMI 18.5 is refused; the lowest allowed is 58.7 at 178 cm", () => {
    expect(lowestGoalKg(178)).toBe(58.7);
    expect(codes(validateProfile({ ...alex, goalWeightKg: 58.6 }, eligible))).toEqual(["GOAL_TOO_LOW:goalWeightKg"]);
  });
  it("CS-03c the lowest goal itself is allowed", () => {
    expect(validateProfile({ ...alex, goalWeightKg: 58.7 }, eligible).ok).toBe(true);
  });
  it("CS-03d values outside the ranges", () => {
    expect(codes(validateProfile({ ...alex, heightCm: 250 }, eligible))).toEqual(["OUT_OF_RANGE:heightCm"]);
    expect(codes(validateProfile({ ...alex, startWeightKg: 20 }, eligible))).toEqual(["OUT_OF_RANGE:startWeightKg"]);
    expect(codes(validateProfile({ ...alex, ageYears: 101 }, eligible))).toEqual(["OUT_OF_RANGE:ageYears"]);
  });
  it("CS-03e exactly 1 kg below is allowed", () => {
    expect(validateProfile({ ...alex, goalWeightKg: 91 }, eligible).ok).toBe(true);
  });
  it("CS-03f the goal is compared with the latest check-in", () => {
    expect(codes(validateProfile({ ...alex, goalWeightKg: 84.5 }, { eligibleConfirmed: true, latestCheckInKg: 85 }))).toEqual([
      "GOAL_NOT_BELOW:goalWeightKg",
    ]);
  });
});
