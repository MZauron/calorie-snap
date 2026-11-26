import { describe, expect, it } from "vitest";
import { localDate, addDays, daysBetween } from "./time";
import { macroProgress, mealTypeAt, proteinTip, todaySummary } from "./today";

describe("CS-08 today", () => {
  it("CS-08a limit 2220, burn 2770, eaten 1190", () => {
    expect(todaySummary({ limit: 2220, burn: 2770, eaten: 1190 })).toEqual({ eaten: 1190, left: 1030, over: 0, deficitSoFar: 1580, endsNear: 550 });
  });
  it("CS-08b over the limit", () => {
    expect(todaySummary({ limit: 2220, burn: 2770, eaten: 2400 })).toMatchObject({ left: -180, over: 180, deficitSoFar: 370 });
  });
  it("CS-08c nothing eaten yet", () => {
    expect(todaySummary({ limit: 2220, burn: 2770, eaten: 0 })).toMatchObject({ left: 2220, over: 0, deficitSoFar: 2770 });
  });
  it("CS-08d a meal's day is the date in the user's zone", () => {
    const instant = new Date("2026-11-25T03:00:00Z");
    expect(localDate(instant, "America/Toronto")).toBe("2026-11-24");
    expect(localDate(instant, "UTC")).toBe("2026-11-25");
  });
  it("CS-08e day arithmetic ignores daylight saving", () => {
    expect(daysBetween("2027-03-13", "2027-03-15")).toBe(2);
    expect(addDays("2027-03-13", 1)).toBe("2027-03-14");
    expect(addDays("2027-03-14", 1)).toBe("2027-03-15");
    expect(addDays("2026-11-01", 1)).toBe("2026-11-02");
    expect(localDate(new Date("2027-03-14T07:30:00Z"), "America/Toronto")).toBe("2027-03-14");
  });
});

describe("CS-09 protein tip", () => {
  it("CS-09a 64 g left in 1030 kcal", () => {
    expect(proteinTip({ proteinLeft: 64, kcalLeft: 1030 })).toEqual({ grams: 64, kcal: 1030 });
  });
  it("CS-09b under 15 g left: no tip", () => {
    expect(proteinTip({ proteinLeft: 10, kcalLeft: 1030 })).toBeNull();
  });
  it("CS-09c no kcal left: no tip", () => {
    expect(proteinTip({ proteinLeft: 64, kcalLeft: 0 })).toBeNull();
    expect(proteinTip({ proteinLeft: 64, kcalLeft: -50 })).toBeNull();
  });
  it("CS-09d exactly 15 g left shows the tip", () => {
    expect(proteinTip({ proteinLeft: 15, kcalLeft: 300 })).toEqual({ grams: 15, kcal: 300 });
  });
});

describe("CS-06 macro progress (Q10)", () => {
  const targets = { protein: 135, carbs: 275, fat: 65 };
  const none = { protein: 0, carbs: 0, fat: 0 };
  it("CS-06e protein over its target: goal met", () => {
    expect(macroProgress(targets, { ...none, protein: 140 }).protein).toEqual({ target: 135, eaten: 140, toGo: 0, met: true });
  });
  it("CS-06f fat is a target: on target within 10%, then over or to go", () => {
    expect(macroProgress(targets, { ...none, fat: 70 }).fat.state).toBe("on_target");
    expect(macroProgress(targets, { ...none, fat: 75 }).fat).toMatchObject({ state: "over", over: 10 });
    expect(macroProgress(targets, { ...none, fat: 50 }).fat).toMatchObject({ state: "to_go", toGo: 15 });
  });
  it("CS-06g 71 of 135 g protein: 64 g to go", () => {
    expect(macroProgress(targets, { ...none, protein: 71 }).protein).toEqual({ target: 135, eaten: 71, toGo: 64, met: false });
  });
});

describe("CS-16 meal type", () => {
  const at = (hhmm: string) => mealTypeAt(new Date(`2026-11-24T${hhmm}:00-05:00`), "America/Toronto");
  it("CS-16a by the local time in Toronto", () => {
    const times = ["03:59", "04:00", "08:10", "10:59", "11:00", "14:59", "15:00", "17:00", "21:29", "21:30", "22:00"];
    expect(times.map(at)).toEqual(["snack", "breakfast", "breakfast", "breakfast", "lunch", "lunch", "snack", "dinner", "dinner", "snack", "snack"]);
  });
  it("CS-16b the zone decides", () => {
    const instant = new Date("2026-11-24T16:30:00Z");
    expect(mealTypeAt(instant, "America/Toronto")).toBe("lunch");
    expect(mealTypeAt(instant, "America/Vancouver")).toBe("breakfast");
  });
});
