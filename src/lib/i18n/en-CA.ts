// Every user-facing string (Canadian English) and the number and date formatters.
// Components never hard-code copy: they read it from here. Q12: the app name is this one string.
// CS-20: a test (src/lib/rules/tone.test.ts) checks every string here for banned words.
import type { ErrorCode, IsoDate } from "@/lib/rules/types";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "April 14, 2027" (CS-07). */
function longDate(date: IsoDate): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** "about 20 weeks" / "about 8.5 weeks" / "about 1 week": one decimal, whole numbers without ".0" (CS-07). */
function aboutWeeks(weeks: number): string {
  const n = Number.isInteger(weeks) ? String(weeks) : weeks.toFixed(1);
  return `about ${n} ${weeks === 1 ? "week" : "weeks"}`;
}

/** "10.0 kg": weights always with one decimal. */
const kg = (value: number) => `${value.toFixed(1)} kg`;

/** "1,580": thousands separators. */
const number = (value: number) => value.toLocaleString("en-CA");

export const enCA = {
  app: {
    name: "Calorie Snap",
    description: "Snap your plate, see what's left today.",
  },
  home: {
    title: "Calorie Snap",
    tagline: "Snap your plate, see what's left today.",
    comingSoon: "We're getting things ready. Check back soon.",
  },
  /** The copy for each rule's error code (DESIGN.md "Rules"). */
  errors: {
    NOT_ELIGIBLE: "Please confirm you're 18 or older and not pregnant or breastfeeding.",
    AGE_UNDER_18: "Calorie Snap is for adults 18 and older.",
    PROFILE_INCOMPLETE: "Fill in your details to see your numbers.",
    GOAL_NOT_BELOW: "Your goal needs to be at least 1 kg below your current weight.",
    GOAL_TOO_LOW: "That goal is below a healthy weight for your height.",
    OUT_OF_RANGE: "That number looks outside the usual range. Please check it.",
    NO_FOOD_FOUND: "We couldn't see food in this photo.",
    SCAN_LIMIT: "You've hit today's photo limit · add it manually.",
    ESTIMATE_FAILED: "We couldn't estimate this photo. You can add it manually.",
    NOTE_NOT_UNDERSTOOD: "We couldn't use that note; change the items instead.",
    FOOD_EMPTY: "Type a food to add it.",
    FOOD_DUPLICATE: "That food is already on your list.",
    FOOD_LIST_FULL: "Your list is full. Remove a food to add another.",
    MEAL_INVALID: "Something in this meal needs a look. Please check it.",
  } satisfies Record<ErrorCode, string>,
  format: { longDate, aboutWeeks, kg, number },
} as const;
