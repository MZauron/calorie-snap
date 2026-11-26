// Time for the rules. The zone and the instant are always passed in: nothing here reads the clock or the machine's zone.
// A calendar day is an IsoDate (`YYYY-MM-DD`) in the user's zone; day arithmetic is done on those, in UTC, so it never
// depends on daylight saving or on where the server runs.
import { TZDate } from "@date-fns/tz";
import type { IsoDate } from "./types";

const DAY_MS = 86_400_000;
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Is this an IANA zone the runtime knows ("America/Toronto")? */
export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: zone });
    return zone.length > 0;
  } catch {
    return false;
  }
}

function inZone(instant: Date, zone: string): TZDate {
  if (!isValidZone(zone)) throw new Error("Unknown time zone");
  return new TZDate(instant.getTime(), zone);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The calendar day of an instant in a zone (CS-08: a meal's `local_date`). */
export function localDate(instant: Date, zone: string): IsoDate {
  const d = inZone(instant, zone);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Minutes since local midnight of an instant in a zone (CS-16). */
export function localMinutes(instant: Date, zone: string): number {
  const d = inZone(instant, zone);
  return d.getHours() * 60 + d.getMinutes();
}

export function isIsoDate(value: string): value is IsoDate {
  const m = ISO.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = new Date(Date.UTC(y, mo - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === mo - 1 && utc.getUTCDate() === d;
}

function toUtcMs(date: IsoDate): number {
  if (!isIsoDate(date)) throw new Error("Not a calendar date");
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function fromUtcMs(ms: number): IsoDate {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export const addDays = (date: IsoDate, days: number): IsoDate => fromUtcMs(toUtcMs(date) + days * DAY_MS);

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: IsoDate, to: IsoDate): number => Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);

/** Whole years from `from` to `to` (birthdays count on the day). */
export function wholeYearsBetween(from: IsoDate, to: IsoDate): number {
  const [fy, fm, fd] = from.split("-").map(Number) as [number, number, number];
  const [ty, tm, td] = to.split("-").map(Number) as [number, number, number];
  toUtcMs(from);
  toUtcMs(to);
  let years = ty - fy;
  if (tm < fm || (tm === fm && td < fd)) years -= 1;
  return years;
}

/** Day of the week, 0 = Sunday … 6 = Saturday. */
export const weekday = (date: IsoDate): number => new Date(toUtcMs(date)).getUTCDay();
