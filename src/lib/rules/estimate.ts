// The photo estimate: validate and clamp a model reply (CS-14), then the corrections (CS-15): ×, Swap, add chips, note chips,
// "+N kcal" notes, portion, and the totals. Pure. Model output is untrusted data: it is parsed with zod, numbers are clamped,
// and nothing here turns it into HTML.
import { z } from "zod";
import { ADJUSTMENTS, type AdjustmentId } from "@/lib/catalog/adjustments";
import { DEFAULT_SCANS_PER_DAY, ESTIMATE_LIMITS, NOTE_MAX_KCAL, NOTE_MAX_LENGTH, PORTION, clamp, roundTo } from "./config";
import { allow, refuse, type Decision, type ErrorCode } from "./types";

// ---------------------------------------------------------------------------
// CS-14 The model's reply
// ---------------------------------------------------------------------------

const num = z.coerce.number().refine(Number.isFinite);
const text = z.string().transform((s) => s.replace(/\s+/g, " ").trim());
const food = z.object({
  name: text,
  amount: text.optional().nullable(),
  kcal: num,
  protein: num.optional().default(0),
  carbs: num.optional().default(0),
  fat: num.optional().default(0),
});
/** What the vision integration must return (src/lib/integrations/vision). */
export const modelReplySchema = z.object({
  name: text,
  confidence: num,
  items: z.array(food.extend({ swap: food.optional().nullable() })).max(200),
});
export type ModelReply = z.input<typeof modelReplySchema>;

export type ItemOrigin = "model" | "swap" | "added" | "adjustment" | "catalog";
export type FoodValues = { name: string; amount: string | null; kcal: number; protein: number; carbs: number; fat: number };
export type EstimateItem = FoodValues & { origin: ItemOrigin; swap: FoodValues | null };

export type Estimate = {
  name: string;
  confidence: number;
  /** CS-14: under 0.5 the card says "Not sure about this one · check the items". */
  lowConfidence: boolean;
  items: EstimateItem[];
  /** CS-15: 0.25–3 in steps of 0.25, applied to all items. */
  portion: number;
  /** CS-15: the note chips applied (each once). */
  chips: AdjustmentId[];
  /** CS-15: kcal from typed "+N kcal" / "−N kcal" notes, not scaled by the portion. */
  kcalOffset: number;
  /** CS-15: the notes saved with the meal ("Cooked in oil"). */
  notes: string[];
};

const clampFood = (f: z.output<typeof food>): FoodValues => ({
  name: f.name.slice(0, ESTIMATE_LIMITS.nameLength) || "Food",
  amount: f.amount ? f.amount.slice(0, ESTIMATE_LIMITS.amountLength) : null,
  kcal: Math.round(clamp(f.kcal, 0, ESTIMATE_LIMITS.itemKcal)),
  protein: roundTo(clamp(f.protein, 0, ESTIMATE_LIMITS.itemMacroG), 0.1),
  carbs: roundTo(clamp(f.carbs, 0, ESTIMATE_LIMITS.itemMacroG), 0.1),
  fat: roundTo(clamp(f.fat, 0, ESTIMATE_LIMITS.itemMacroG), 0.1),
});

const scaleFood = <T extends FoodValues>(f: T, factor: number): T => ({
  ...f,
  kcal: Math.round(f.kcal * factor),
  protein: roundTo(f.protein * factor, 0.1),
  carbs: roundTo(f.carbs * factor, 0.1),
  fat: roundTo(f.fat * factor, 0.1),
});

export type ParsedEstimate = { ok: true; estimate: Estimate } | { ok: false; code: Extract<ErrorCode, "NO_FOOD_FOUND" | "ESTIMATE_FAILED"> };

/**
 * CS-14: turn a model reply into an estimate. A reply of the wrong shape is ESTIMATE_FAILED (→ "Add it manually"); no items
 * is NO_FOOD_FOUND. Items are clamped to 0–3000 kcal and 0–300 g of each macro, at most 50 are kept, and a meal over 5000 kcal
 * is scaled down to 5000 (build decision: the person still sees and can fix every item).
 */
export function parseEstimate(raw: unknown): ParsedEstimate {
  const parsed = modelReplySchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "ESTIMATE_FAILED" };
  const reply = parsed.data;
  let items: EstimateItem[] = reply.items
    .filter((i) => i.name.length > 0)
    .slice(0, ESTIMATE_LIMITS.items)
    .map((i) => ({ ...clampFood(i), origin: "model", swap: i.swap && i.swap.name ? clampFood(i.swap) : null }));
  if (items.length === 0) return { ok: false, code: "NO_FOOD_FOUND" };
  const total = items.reduce((s, i) => s + i.kcal, 0);
  if (total > ESTIMATE_LIMITS.mealKcal) items = items.map((i) => scaleFood(i, ESTIMATE_LIMITS.mealKcal / total));
  const confidence = roundTo(clamp(reply.confidence, 0, 1), 0.01);
  return {
    ok: true,
    estimate: {
      name: reply.name.slice(0, ESTIMATE_LIMITS.nameLength) || items[0]!.name,
      confidence,
      lowConfidence: confidence < ESTIMATE_LIMITS.lowConfidence,
      items,
      portion: 1,
      chips: [],
      kcalOffset: 0,
      notes: [],
    },
  };
}

/** CS-14 (Q8 default): may this person scan again today? */
export function checkScanAllowed(scansToday: number, perDay: number = DEFAULT_SCANS_PER_DAY): Decision {
  return scansToday >= perDay ? refuse({ code: "SCAN_LIMIT" }) : allow();
}

// ---------------------------------------------------------------------------
// CS-15 Corrections
// ---------------------------------------------------------------------------

/** × on a row. */
export const removeItem = (e: Estimate, index: number): Estimate => ({ ...e, items: e.items.filter((_, i) => i !== index) });

/** "Swap: Regular-crust pizza": the model's alternative takes the row's place. */
export function swapItem(e: Estimate, index: number): Estimate {
  const item = e.items[index];
  if (!item?.swap) return e;
  return { ...e, items: e.items.map((it, i) => (i === index ? { ...item.swap!, origin: "swap", swap: null } : it)) };
}

/** A dashed add chip ("+ Cooking oil") or a picked catalogue food. */
export const addItem = (e: Estimate, item: FoodValues, origin: "added" | "catalog" = "added"): Estimate => ({
  ...e,
  items: [...e.items, { ...clampFood({ ...item, amount: item.amount ?? undefined }), origin, swap: null }],
});

/** A note chip (Q16): each applies once; "add" chips add an item, "scale" chips multiply the meal. The chip's label is saved as a note. */
export function applyChip(e: Estimate, id: AdjustmentId, label: string): Estimate {
  if (e.chips.includes(id)) return e;
  const adjustment = ADJUSTMENTS[id];
  const items =
    adjustment.kind === "add" ? [...e.items, { ...adjustment.item, origin: "adjustment" as const, swap: null }] : e.items;
  return { ...e, items, chips: [...e.chips, id], notes: [...e.notes, label] };
}

/** The product of the applied "scale" chips (Bigger portion ×1.25, Smaller ×0.75, Didn't finish ×0.75). */
const chipFactor = (e: Estimate) =>
  e.chips.reduce((f, id) => {
    const a = ADJUSTMENTS[id];
    return a.kind === "scale" ? f * a.factor : f;
  }, 1);

export type TypedNote = { kind: "kcal"; kcal: number } | { kind: "model"; text: string };

/**
 * CS-15: a typed note. "+150 kcal" / "−100 kcal" (also "-100", "+150 cal", "+150 calories") is applied directly; any other
 * text goes to the model to re-estimate. Empty or too long is NOTE_NOT_UNDERSTOOD.
 */
export function readNote(raw: string): { ok: true; note: TypedNote } | { ok: false; code: "NOTE_NOT_UNDERSTOOD" } {
  const note = raw.replace(/\s+/g, " ").trim();
  if (note.length === 0 || note.length > NOTE_MAX_LENGTH) return { ok: false, code: "NOTE_NOT_UNDERSTOOD" };
  const m = /^([+\-−–])\s?(\d{1,5})\s?(kcal|cal|calories)?$/i.exec(note);
  if (m) {
    const kcal = Number(m[2]);
    if (kcal === 0 || kcal > NOTE_MAX_KCAL) return { ok: false, code: "NOTE_NOT_UNDERSTOOD" };
    return { ok: true, note: { kind: "kcal", kcal: m[1] === "+" ? kcal : -kcal } };
  }
  return { ok: true, note: { kind: "model", text: note } };
}

/** Apply a "+N kcal" note: kept as an offset (not scaled by the portion) and saved as a note. */
export const applyKcalNote = (e: Estimate, kcal: number, label: string): Estimate => ({
  ...e,
  kcalOffset: e.kcalOffset + kcal,
  notes: [...e.notes, label],
});

/** Keep a note the model couldn't use ("We couldn't use that note; change the items instead"). */
export const keepNote = (e: Estimate, label: string): Estimate => ({ ...e, notes: [...e.notes, label] });

/** The notes as saved with the meal (meals.note, ≤ 200 characters). */
export const noteText = (e: Estimate): string | null => (e.notes.length ? e.notes.join("; ").slice(0, NOTE_MAX_LENGTH) : null);

/** CS-15: snap a portion to 0.25–3 in steps of 0.25. */
export const snapPortion = (p: number) => clamp(roundTo(p, PORTION.step), PORTION.min, PORTION.max);
/** The − / + buttons. */
export const stepPortion = (p: number, direction: 1 | -1) => snapPortion(p + direction * PORTION.step);
export const setPortion = (e: Estimate, p: number): Estimate => ({ ...e, portion: snapPortion(p) });

export type Totals = { kcal: number; protein: number; carbs: number; fat: number };

/** The estimate card's kcal and macro tiles: items × portion × chip factor, plus typed kcal notes; never below 0. */
export function estimateTotals(e: Pick<Estimate, "items" | "portion" | "chips" | "kcalOffset">): Totals {
  const factor = e.portion * chipFactor(e as Estimate);
  const sum = (k: keyof Totals) => e.items.reduce((s, i) => s + i[k], 0) * factor;
  return {
    kcal: Math.max(0, Math.round(sum("kcal") + e.kcalOffset)),
    protein: roundTo(sum("protein"), 0.1),
    carbs: roundTo(sum("carbs"), 0.1),
    fat: roundTo(sum("fat"), 0.1),
  };
}

/** "After this you'll have N kcal left." */
export const kcalLeftAfter = (kcalLeft: number, mealKcal: number) => kcalLeft - mealKcal;
