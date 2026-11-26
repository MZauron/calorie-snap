import { describe, expect, it } from "vitest";
import { enCA } from "@/lib/i18n/en-CA";
import {
  ageOn,
  averageDeficit,
  burnKcal,
  checkComplete,
  currentWeightKg,
  dailyNumbers,
  estimatedWeightKg,
  macroTargets,
  planDifference,
  planWeightKg,
  progressToGoal,
  timeline,
} from "./numbers";
import { addDays } from "./time";

const prototype = { sex: "male", age: 42, heightCm: 178, currentKg: 92, activity: "moderate", pace: 0.5 } as const;
const example = { sex: "male", age: 32, heightCm: 178, currentKg: currentWeightKg(86.0, 83.1), activity: "moderate", pace: 0.5 } as const;

describe("CS-02 burn", () => {
  it("CS-02a male, 42, 178 cm, 92 kg, moderate burns 2830", () => {
    expect(burnKcal({ sex: "male", weightKg: 92, heightCm: 178, age: 42, activity: "moderate" })).toBe(2830);
  });
  it("CS-02b the latest check-in is used: 2770", () => {
    expect(example.currentKg).toBe(83.1);
    expect(dailyNumbers(example).burn).toBe(2770);
  });
  it("CS-02c female, 35, 165 cm, 70 kg, light burns 1920", () => {
    expect(burnKcal({ sex: "female", weightKg: 70, heightCm: 165, age: 35, activity: "light" })).toBe(1920);
  });
  it("CS-02d a missing height makes the profile incomplete", () => {
    expect(checkComplete({ sex: "male", ageYears: 42, heightCm: null, startWeightKg: 92, activity: "moderate" })).toEqual({
      ok: false,
      errors: [{ code: "PROFILE_INCOMPLETE", field: "heightCm" }],
    });
  });
  it("CS-02e the age grows with whole years since it was entered", () => {
    expect(ageOn(32, "2026-09-29", "2027-09-28")).toBe(32);
    expect(ageOn(32, "2026-09-29", "2027-09-29")).toBe(33);
  });
  it("CS-02f active uses 1.725: 3150", () => {
    expect(burnKcal({ sex: "male", weightKg: 92, heightCm: 178, age: 42, activity: "active" })).toBe(3150);
  });
});

describe("CS-04 pace cap", () => {
  it("CS-04a 83.1 kg choosing 1 kg/week is capped at 0.8: deficit 880, limit 1890", () => {
    const n = dailyNumbers({ ...example, pace: 1 });
    expect(n.paceCap).toBe(0.8);
    expect(n.paceCapped).toBe(true);
    expect(n.plannedPace).toBe(0.8);
    expect(n.deficit).toBe(880);
    expect(n.limit).toBe(1890);
  });
  it("CS-04b 92 kg: cap 0.9; 1 is capped, 0.75 is not", () => {
    expect(dailyNumbers({ ...prototype, pace: 1 })).toMatchObject({ paceCap: 0.9, paceCapped: true });
    expect(dailyNumbers({ ...prototype, pace: 0.75 })).toMatchObject({ paceCap: 0.9, paceCapped: false, plannedPace: 0.75 });
  });
  it("CS-04c 60 kg: cap 0.6, 0.75 is planned at 0.6", () => {
    expect(dailyNumbers({ ...prototype, currentKg: 60, pace: 0.75 })).toMatchObject({ paceCap: 0.6, paceCapped: true, plannedPace: 0.6 });
  });
});

describe("CS-05 daily limit", () => {
  const woman = { sex: "female", age: 30, heightCm: 160, currentKg: 55, activity: "light", pace: 0.5 } as const;
  it("CS-05a burn 2830 at 0.5: limit 2280, deficit 550", () => {
    expect(dailyNumbers(prototype)).toMatchObject({ burn: 2830, limit: 2280, deficit: 550, minimumBinds: false, effectivePace: 0.5 });
  });
  it("CS-05b the female minimum binds at 1200", () => {
    expect(dailyNumbers(woman)).toMatchObject({ burn: 1700, limit: 1200, minimum: 1200, minimumBinds: true, deficit: 500, effectivePace: 0.45 });
  });
  it("CS-05c the male minimum binds at 1500", () => {
    const n = dailyNumbers({ sex: "male", age: 70, heightCm: 160, currentKg: 60, activity: "light", pace: 0.5 });
    expect(n).toMatchObject({ burn: 1730, limit: 1500, minimumBinds: true, deficit: 230 });
  });
  it("CS-05d when the minimum binds, the timeline uses the real deficit", () => {
    const n = dailyNumbers(woman);
    expect(timeline({ estimatedKg: 55, goalKg: 50, deficitKcal: n.deficit, today: "2026-11-25" })).toEqual({
      toLoseKg: 5,
      weeks: 11,
      date: "2027-02-10",
      reached: false,
    });
  });
});

describe("CS-06 macro targets", () => {
  it("CS-06a 92 kg: protein 145 g", () => {
    expect(dailyNumbers(prototype).protein).toBe(145);
  });
  it("CS-06b 83.1 kg: protein 135 g", () => {
    expect(dailyNumbers(example).protein).toBe(135);
  });
  it("CS-06c 92 kg at 2280: fat 75 g, carbs 255 g", () => {
    expect(macroTargets(92, 2280)).toEqual({ protein: 145, fat: 75, carbs: 255 });
  });
  it("CS-06d carbs are never negative", () => {
    expect(macroTargets(150, 1500).carbs).toBe(0);
  });
});

describe("CS-07 timeline", () => {
  it("CS-07a 92 → 82 at 0.5: about 20 weeks, by April 14, 2027", () => {
    const t = timeline({ estimatedKg: 92, goalKg: 82, deficitKcal: dailyNumbers(prototype).deficit, today: "2026-11-25" });
    expect(t).toEqual({ toLoseKg: 10, weeks: 20, date: "2027-04-14", reached: false });
    expect(enCA.format.kg(t.toLoseKg)).toBe("10.0 kg");
    expect(enCA.format.aboutWeeks(t.weeks)).toBe("about 20 weeks");
    expect(enCA.format.longDate(t.date)).toBe("April 14, 2027");
  });
  it("CS-07b est. 81.8 → 75 capped at 0.8: 6.8 kg, about 8.5 weeks, January 24, 2027", () => {
    const deficit = dailyNumbers({ ...example, pace: 1 }).deficit;
    const t = timeline({ estimatedKg: 81.8, goalKg: 75, deficitKcal: deficit, today: "2026-11-25" });
    expect(t).toEqual({ toLoseKg: 6.8, weeks: 8.5, date: "2027-01-24", reached: false });
    expect(enCA.format.aboutWeeks(t.weeks)).toBe("about 8.5 weeks");
    expect(enCA.format.longDate(t.date)).toBe("January 24, 2027");
  });
  it("CS-07c a goal already reached", () => {
    expect(timeline({ estimatedKg: 74.9, goalKg: 75, deficitKcal: 550, today: "2026-11-25" })).toEqual({
      toLoseKg: 0,
      weeks: 0,
      date: "2026-11-25",
      reached: true,
    });
  });
  it("CS-07d weeks to one decimal, the date rounds the days up", () => {
    expect(timeline({ estimatedKg: 78.3, goalKg: 75, deficitKcal: 550, today: "2026-11-25" })).toMatchObject({ toLoseKg: 3.3, weeks: 6.6, date: "2027-01-11" });
  });
});

describe("CS-11 estimated weight, plan, projection", () => {
  it("CS-11a the plan line on Nov 24 is 82.0", () => {
    expect(planWeightKg({ startKg: 86, startDate: "2026-09-29", paceKgWeek: 0.5, goalKg: 75, on: "2026-11-24" })).toBe(82);
  });
  it("CS-11b the check-in minus the logged deficits after it", () => {
    const days = Array.from({ length: 14 }, (_, i) => ({ date: addDays("2026-11-10", i), deficit: 715 }));
    expect(days.at(-1)!.date).toBe("2026-11-23");
    expect(estimatedWeightKg({ date: "2026-11-10", kg: 83.1 }, days, "2026-11-24")).toBe(81.8);
  });
  it("CS-11c with no check-in, the start weight from the start date", () => {
    const days = [
      { date: "2026-09-28", deficit: 7700 },
      { date: "2026-09-29", deficit: 770 },
      { date: "2026-09-30", deficit: 770 },
    ];
    expect(estimatedWeightKg({ date: "2026-09-29", kg: 86 }, days, "2026-11-24")).toBe(85.8);
  });
  it("CS-11d today's deficit is not counted", () => {
    expect(estimatedWeightKg({ date: "2026-11-10", kg: 83.1 }, [{ date: "2026-11-24", deficit: 2770 }], "2026-11-24")).toBe(83.1);
  });
  it("CS-11e on plan within ±0.5 kg", () => {
    expect(planDifference(81.8, 82)).toEqual({ differenceKg: -0.2, status: "on_plan" });
    expect(planDifference(81.4, 82).status).toBe("ahead");
    expect(planDifference(82.6, 82).status).toBe("behind");
    expect(planDifference(82.5, 82).status).toBe("on_plan");
  });
  it("CS-11f 38% of the way, about 6.8 kg to go", () => {
    expect(progressToGoal({ startKg: 86, estimatedKg: 81.8, goalKg: 75 })).toEqual({ percent: 38, toGoKg: 6.8 });
  });
  it("CS-11g the plan line never goes below the goal", () => {
    expect(planWeightKg({ startKg: 86, startDate: "2026-09-29", paceKgWeek: 0.5, goalKg: 75, on: "2028-01-01" })).toBe(75);
  });
  it("CS-11h the average daily deficit", () => {
    const deficits = [1050, 930, 1060, 490, 1345, 1120];
    expect(averageDeficit(deficits.map((deficit, i) => ({ date: addDays("2026-11-18", i), deficit })))).toBe(999);
  });
});
