// Days: deficits, day status, the streak, week bars and "Last N full days" (CS-10, 12; Q13). Pure.
import { FULL_DAYS_WINDOW, KCAL_PER_KG, roundGrams5, roundTo } from "./config";
import { addDays } from "./time";
import type { IsoDate } from "./types";

/** One day of the log. `meals` is how many meals it has (0 = Not logged). */
export type Day = { date: IsoDate; eaten: number; meals: number };

/** CS-10: a day's deficit = burn − eaten. */
export const dayDeficit = (burn: number, eaten: number) => burn - eaten;

/** CS-10: "That's about N g of fat burned (est.)": deficit ÷ 7.7, to 5 g. */
export const fatBurnedGrams = (deficitKcal: number) => roundGrams5(deficitKcal / (KCAL_PER_KG / 1000));

/** CS-10: "Equals about N kg of fat lost": kcal ÷ 7,700, to 0.01 kg. */
export const kgFromKcal = (kcal: number) => roundTo(kcal / KCAL_PER_KG, 0.01);

export type DayStatus = "not_logged" | "under" | "over" | "too_low";

/**
 * CS-12: Under (≤ limit and ≥ minimum), Over (> limit), Too low (< minimum; completed days only, so today is never Too low),
 * Not logged (no meal, Q13).
 */
export function dayStatus(day: Day, input: { limit: number; minimum: number; today: IsoDate }): DayStatus {
  if (day.meals === 0) return "not_logged";
  if (day.eaten > input.limit) return "over";
  if (day.eaten < input.minimum && day.date < input.today) return "too_low";
  return "under";
}

/**
 * CS-12: consecutive Under days ending today, or yesterday when today has nothing logged yet. Over, Too low and a day with
 * nothing logged end it. `statusOn` answers for any date.
 */
export function streak(statusOn: (date: IsoDate) => DayStatus, today: IsoDate, maxDays = 3660): number {
  let date = statusOn(today) === "not_logged" ? addDays(today, -1) : today;
  let count = 0;
  while (count < maxDays && statusOn(date) === "under") {
    count += 1;
    date = addDays(date, -1);
  }
  return count;
}

/**
 * CS-10: "Last N full days": the completed days of the last 7 (today − 6 … yesterday) that have a meal logged (Q13), with their
 * total deficit and its kg.
 */
export function lastFullDays(days: Day[], input: { burn: number; today: IsoDate }): { days: Day[]; totalDeficit: number; kg: number } {
  const from = addDays(input.today, -(FULL_DAYS_WINDOW - 1));
  const full = days.filter((d) => d.meals > 0 && d.date >= from && d.date < input.today).sort((a, b) => a.date.localeCompare(b.date));
  const totalDeficit = full.reduce((sum, d) => sum + dayDeficit(input.burn, d.eaten), 0);
  return { days: full, totalDeficit, kg: kgFromKcal(totalDeficit) };
}

/** CS-10: a sum of deficits and its kg ("Total 5,995 kcal · about 0.78 kg"). */
export function deficitTotal(deficits: number[]): { total: number; kg: number } {
  const total = deficits.reduce((sum, d) => sum + d, 0);
  return { total, kg: kgFromKcal(total) };
}

export type WeekBar = { date: IsoDate; eaten: number; colour: "under" | "over" | "none" };

/** CS-12 week bars: the 7 days ending today, green when ≤ limit, orange when over, none when not logged; the average of logged days. */
export function weekBars(days: Day[], input: { limit: number; today: IsoDate }): { bars: WeekBar[]; average: number | null } {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const bars: WeekBar[] = [];
  for (let i = FULL_DAYS_WINDOW - 1; i >= 0; i -= 1) {
    const date = addDays(input.today, -i);
    const day = byDate.get(date);
    if (!day || day.meals === 0) bars.push({ date, eaten: 0, colour: "none" });
    else bars.push({ date, eaten: day.eaten, colour: day.eaten > input.limit ? "over" : "under" });
  }
  const logged = bars.filter((b) => b.colour !== "none");
  const average = logged.length ? Math.round(logged.reduce((s, b) => s + b.eaten, 0) / logged.length) : null;
  return { bars, average };
}
