// Tone (CS-20): the BMI range name, the banned-words check (a test runs it over every string in en-CA.ts), and when
// encouragement may show. Pure.
import { BANNED_WORDS, BMI_RANGES, roundTo } from "./config";
import type { DayStatus } from "./days";
import { bmiOf } from "./profile";

export type BmiRange = (typeof BMI_RANGES)[number]["range"];

/** CS-20: BMI (est.) to 0.1 and its range name. No advice attached. */
export function bmi(kg: number, heightCm: number): { value: number; range: BmiRange } {
  const value = roundTo(bmiOf(kg, heightCm), 0.1);
  return { value, range: BMI_RANGES.find((r) => value < r.below)!.range };
}

/** CS-20: the banned words found in a text (whole words, any case). */
export function bannedWordsIn(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  return [...new Set(words.filter((w) => (BANNED_WORDS as readonly string[]).includes(w)))];
}

/** CS-20: encouragement never shows for a Too low day. */
export const mayEncourage = (status: DayStatus) => status !== "too_low";
