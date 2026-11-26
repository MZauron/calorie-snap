// The note chips on the estimate card (CS-15). Q16 default: the prototype only shows Cooked in oil (+120 kcal, 1 tbsp);
// the others are the defaults written in DESIGN.md CS-15. Macros of Extra cheese are approximate (30 g of cheddar).
// Pure data: the rules (src/lib/rules/estimate.ts) apply them.

export type AdjustmentItem = { name: string; amount: string; kcal: number; protein: number; carbs: number; fat: number };
export type Adjustment =
  | { id: AdjustmentId; kind: "add"; item: AdjustmentItem }
  | { id: AdjustmentId; kind: "scale"; factor: number };

export const ADJUSTMENT_IDS = ["cooked_in_oil", "butter", "extra_cheese", "extra_sauce", "bigger_portion", "smaller_portion", "didnt_finish"] as const;
export type AdjustmentId = (typeof ADJUSTMENT_IDS)[number];

export const ADJUSTMENTS: Record<AdjustmentId, Adjustment> = {
  cooked_in_oil: { id: "cooked_in_oil", kind: "add", item: { name: "Cooking oil", amount: "1 tbsp", kcal: 120, protein: 0, carbs: 0, fat: 14 } },
  butter: { id: "butter", kind: "add", item: { name: "Butter", amount: "1 tbsp", kcal: 100, protein: 0, carbs: 0, fat: 11 } },
  extra_cheese: { id: "extra_cheese", kind: "add", item: { name: "Extra cheese", amount: "30 g", kcal: 110, protein: 7, carbs: 0, fat: 9 } },
  extra_sauce: { id: "extra_sauce", kind: "add", item: { name: "Extra sauce", amount: "1 serving", kcal: 60, protein: 0, carbs: 0, fat: 0 } },
  bigger_portion: { id: "bigger_portion", kind: "scale", factor: 1.25 },
  smaller_portion: { id: "smaller_portion", kind: "scale", factor: 0.75 },
  didnt_finish: { id: "didnt_finish", kind: "scale", factor: 0.75 },
};
