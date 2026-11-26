import { describe, expect, it } from "vitest";
import { dayStatus, deficitTotal, fatBurnedGrams, lastFullDays, streak, weekBars, type Day, type DayStatus } from "./days";
import { addDays } from "./time";

const today = "2026-11-24";
const limits = { limit: 2220, minimum: 1500, today };
const day = (date: string, eaten: number, meals = 3): Day => ({ date, eaten, meals });
const statuses = (map: Record<string, DayStatus>) => (date: string) => map[date] ?? "not_logged";

describe("CS-10 deficits", () => {
  it("CS-10a six logged deficits: 5995 kcal, about 0.78 kg", () => {
    expect(deficitTotal([1050, 930, 1060, 490, 1345, 1120])).toEqual({ total: 5995, kg: 0.78 });
  });
  it("CS-10b a 1345 kcal deficit is about 175 g of fat", () => {
    expect(fatBurnedGrams(1345)).toBe(175);
  });
  const week = [day("2026-11-17", 1000), day("2026-11-18", 2000), day("2026-11-19", 2000), day("2026-11-20", 0, 0), day("2026-11-21", 2000), day("2026-11-23", 2000), day(today, 500)];
  it("CS-10c only logged days in the last 7 count", () => {
    const r = lastFullDays(week, { burn: 2770, today });
    expect(r.days.map((d) => d.date)).toEqual(["2026-11-18", "2026-11-19", "2026-11-21", "2026-11-23"]);
    expect(r.totalDeficit).toBe(4 * 770);
  });
  it("CS-10d today is never a full day", () => {
    expect(lastFullDays(week, { burn: 2770, today }).days.some((d) => d.date === today)).toBe(false);
  });
});

describe("CS-12 day status and streak", () => {
  it("CS-12a Sunday at 1425 kcal is Too low", () => {
    expect(dayStatus(day("2026-11-22", 1425, 5), limits)).toBe("too_low");
  });
  it("CS-12b today Under, Monday Under, Sunday Too low: streak 2", () => {
    expect(streak(statuses({ "2026-11-24": "under", "2026-11-23": "under", "2026-11-22": "too_low", "2026-11-21": "under" }), today)).toBe(2);
  });
  it("CS-12c today is never Too low", () => {
    expect(dayStatus(day(today, 1000), limits)).toBe("under");
  });
  it("CS-12d over the limit", () => {
    expect(dayStatus(day("2026-11-23", 2300), limits)).toBe("over");
  });
  it("CS-12e a day with no meal is Not logged", () => {
    expect(dayStatus(day("2026-11-23", 0, 0), limits)).toBe("not_logged");
  });
  it("CS-12f with nothing logged today, the streak counts from yesterday", () => {
    expect(streak(statuses({ "2026-11-23": "under", "2026-11-22": "under", "2026-11-21": "too_low" }), today)).toBe(2);
  });
  it("CS-12g an Over day ends the streak", () => {
    expect(streak(statuses({ "2026-11-24": "under", "2026-11-23": "over", "2026-11-22": "under" }), today)).toBe(1);
  });
  it("CS-12h exactly the limit and exactly the minimum are Under", () => {
    expect(dayStatus(day("2026-11-23", 2220), limits)).toBe("under");
    expect(dayStatus(day("2026-11-23", 1500), limits)).toBe("under");
  });
  it("CS-12i the week bars and the average of logged days", () => {
    const eaten = [1900, 2300, null, 2100, 1800, 2000, 1200];
    const days = eaten.flatMap((e, i) => (e == null ? [] : [day(addDays("2026-11-18", i), e)]));
    const r = weekBars(days, { limit: 2220, today });
    expect(r.bars.map((b) => b.colour)).toEqual(["under", "over", "none", "under", "under", "under", "under"]);
    expect(r.bars.at(-1)!.date).toBe(today);
    expect(r.average).toBe(1883);
  });
});
