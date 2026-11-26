# Rules test cases

Cases `src/lib/rules` must pass. Seeded from DESIGN.md "Worked numbers from the prototype" (marked **worked**), plus edge cases per rule.
Each id is the name of exactly one test (`it("CS-05b …")` in `src/lib/rules/*.test.ts`); `cases.test.ts` fails when an id here has no test or a test uses an id that isn't here.
Add a case here first, then its test. Ids are never reused.

Unless a case says otherwise: kcal are per day, weights in kg, heights in cm, `today` is a date in the user's zone.

## CS-01 Eligibility
| Id | Input | Expected |
| --- | --- | --- |
| CS-01a | A goal weight is saved without the eligibility confirmation | `NOT_ELIGIBLE` |
| CS-01b | Age 17 | `AGE_UNDER_18` |
| CS-01c | The Start checkbox unticked / ticked | `NOT_ELIGIBLE` / ok |
| CS-01d | Age 18, eligibility confirmed, a valid goal | ok |

## CS-02 Burn
| Id | Input | Expected |
| --- | --- | --- |
| CS-02a | **worked** Male, 42 y, 178 cm, 92 kg, Moderate | Burn 2830 |
| CS-02b | **worked** Male, 32 y, 178 cm, latest check-in 83.1 (start 86.0), Moderate | Burn 2770 (uses the check-in) |
| CS-02c | Female, 35 y, 165 cm, 70 kg, Light | Burn 1920 |
| CS-02d | A profile without a height | `PROFILE_INCOMPLETE` (field `heightCm`) |
| CS-02e | Age 32 entered on 2026-09-29; on 2027-09-28 / on 2027-09-29 | 32 / 33 |
| CS-02f | Male, 42 y, 178 cm, 92 kg, Active | Burn 3150 |

## CS-03 Inputs and the goal
| Id | Input | Expected |
| --- | --- | --- |
| CS-03a | Current 92, goal 91.5 | `GOAL_NOT_BELOW` |
| CS-03b | 178 cm, goal 58.6 (BMI 18.49) | `GOAL_TOO_LOW`; lowest goal 58.7 |
| CS-03c | 178 cm, current 92, goal 58.7 | ok |
| CS-03d | Height 250 / start weight 20 / age 101 | `OUT_OF_RANGE` on that field |
| CS-03e | Current 92, goal 91 (exactly 1 kg less) | ok |
| CS-03f | Start 92, latest check-in 85, goal 84.5 | `GOAL_NOT_BELOW` (compared with the check-in) |

## CS-04 Pace cap
| Id | Input | Expected |
| --- | --- | --- |
| CS-04a | **worked** Current 83.1 (CS-02b person), pace 1 chosen | Cap 0.8; deficit 880; limit 1890; ⚠ shown |
| CS-04b | Current 92, pace 1 / pace 0.75 | Cap 0.9, capped / not capped |
| CS-04c | Current 60, pace 0.75 | Cap 0.6, capped, planned with 0.6 |

## CS-05 Daily limit and the safe minimum
| Id | Input | Expected |
| --- | --- | --- |
| CS-05a | **worked** Burn 2830 (CS-02a person), pace 0.5 | Limit 2280, deficit 550 |
| CS-05b | Female, 30 y, 160 cm, 55 kg, Light (burn 1700), pace 0.5 | Limit 1200 (minimum binds), deficit 500, effective pace 0.45 |
| CS-05c | Male, 70 y, 160 cm, 60 kg, Light (burn 1730), pace 0.5 | Limit 1500 (minimum binds), deficit 230 |
| CS-05d | The CS-05b person, estimated 55, goal 50, today 2026-11-25 | Timeline uses the real 500 kcal deficit: 11 weeks, 2027-02-10 |

## CS-06 Macro targets (Q4, Q10)
| Id | Input | Expected |
| --- | --- | --- |
| CS-06a | **worked** 92 kg | Protein 145 g |
| CS-06b | **worked** 83.1 kg | Protein 135 g |
| CS-06c | 92 kg, limit 2280 | Fat 75 g, carbs 255 g |
| CS-06d | 150 kg, limit 1500 (protein and fat alone exceed it) | Carbs 0 g, never negative |
| CS-06e | Protein target 135, eaten 140 | 0 g to go, goal met |
| CS-06f | Fat target 65, eaten 70 / 75 / 50 | On target / 10 g over / 15 g to go |
| CS-06g | **worked** Protein target 135, eaten 71 | 64 g to go |

## CS-07 Timeline
| Id | Input | Expected |
| --- | --- | --- |
| CS-07a | **worked** 92 → 82 at 0.5 (deficit 550), today 2026-11-25 | 10.0 kg, "about 20 weeks", "April 14, 2027" |
| CS-07b | **worked** Est. 81.8, goal 75, pace capped at 0.8 (deficit 880), today 2026-11-25 | To lose 6.8 kg, "about 8.5 weeks", "January 24, 2027" |
| CS-07c | Est. 74.9, goal 75 | To lose 0, reached |
| CS-07d | To lose 3.3, deficit 550, today 2026-11-25 | 6.6 weeks; date = today + ⌈46.2⌉ = 47 days = 2027-01-11 |

## CS-08 Today
| Id | Input | Expected |
| --- | --- | --- |
| CS-08a | **worked** Limit 2220, burn 2770, eaten 1190 | Left 1030, deficit so far 1580, ends near 550 |
| CS-08b | Limit 2220, burn 2770, eaten 2400 | Left −180, 180 kcal over, deficit so far 370 |
| CS-08c | Nothing eaten | Left 2220, deficit so far 2770 |
| CS-08d | The instant 2026-11-25 03:00 UTC | `local_date` 2026-11-24 in America/Toronto, 2026-11-25 in UTC |
| CS-08e | Across the spring-forward night (2027-03-13 → 2027-03-15 in Toronto) | 2 days; adding days never skips or repeats a date |

## CS-09 Protein tip
| Id | Input | Expected |
| --- | --- | --- |
| CS-09a | **worked** 64 g protein left, 1030 kcal left | Tip: 64 g in 1030 kcal |
| CS-09b | 10 g left | No tip |
| CS-09c | 64 g left, 0 kcal left / −50 kcal left | No tip |
| CS-09d | Exactly 15 g left, 300 kcal left | Tip |

## CS-10 Deficits (Q13)
| Id | Input | Expected |
| --- | --- | --- |
| CS-10a | **worked** Logged deficits 1050, 930, 1060, 490, 1345, 1120 | Total 5995; ≈ 0.78 kg |
| CS-10b | **worked** Day deficit 1345 | ≈ 175 g fat |
| CS-10c | Burn 2770, today 2026-11-24; logged 11-18, 11-19, 11-21, 11-23; 11-20 has no meal; 11-17 is outside the window | 4 full days; the empty day and 11-17 are not counted |
| CS-10d | The same, with meals today | Today is never a full day |

## CS-11 Estimated weight, plan, projection (Q14)
| Id | Input | Expected |
| --- | --- | --- |
| CS-11a | **worked** Start 86.0 on 2026-09-29, pace 0.5, on 2026-11-24 | Plan 82.0 |
| CS-11b | Check-in 83.1 on 2026-11-10, logged deficits from 11-10 to 11-23 totalling 10010, today 11-24 | Now (est.) 81.8 |
| CS-11c | No check-in: start 86.0 on 2026-09-29; a logged day before the start | Anchored on the start; the earlier day ignored |
| CS-11d | A deficit logged today | Not counted (today is still going) |
| CS-11e | Est. 81.8 / 81.4 / 82.6 / 82.5 against plan 82.0 | On plan / Ahead / Behind / On plan |
| CS-11f | **worked** Start 86.0, est. 81.8, goal 75 | 38% of the way, about 6.8 kg to go |
| CS-11g | Start 86.0 on 2026-09-29, pace 0.5, goal 75, on 2028-01-01 | Plan 75.0 (never below the goal) |
| CS-11h | Deficits 1050, 930, 1060, 490, 1345, 1120 | Average 999 kcal |

## CS-12 Day status and the streak
| Id | Input | Expected |
| --- | --- | --- |
| CS-12a | **worked** Sun 2026-11-22 eaten 1425, male (minimum 1500), limit 2220, today 11-24 | Too low |
| CS-12b | **worked** Today Under, Mon Under, Sun Too low | Streak 2 |
| CS-12c | Today, eaten 1000 (below the minimum) | Under (today is never Too low) |
| CS-12d | Eaten 2300, limit 2220 | Over |
| CS-12e | No meal that day | Not logged |
| CS-12f | Nothing logged today; yesterday and the day before Under, then Too low | Streak 2 (counted from yesterday) |
| CS-12g | Today Under, yesterday Over | Streak 1 |
| CS-12h | Eaten exactly 2220 (the limit) / exactly 1500 on a past day (the minimum) | Under / Under |
| CS-12i | Week to 2026-11-24: 1900, 2300, nothing, 2100, 1800, 2000, 1200 (today), limit 2220 | 7 bars: under, over, none, under, under, under, under; average 1883 |

## CS-14 Photo estimate (Q8)
| Id | Input | Expected |
| --- | --- | --- |
| CS-14a | A valid reply (pizza, 0.87) | Two items, 87% confident, not low |
| CS-14b | An item with 4000 kcal, 400 g protein, −5 g fat | Clamped to 3000 kcal, 300 g, 0 g |
| CS-14c | Confidence 0.4 | Low confidence ("Not sure about this one") |
| CS-14d | No items | `NO_FOOD_FOUND` |
| CS-14e | Not an object / an item without kcal / kcal "lots" | `ESTIMATE_FAILED` |
| CS-14f | Two items of 3000 kcal | Scaled to 2500 + 2500 = 5000 (the meal limit) |
| CS-14g | 30 scans today with a limit of 30 / 29 | `SCAN_LIMIT` / ok |
| CS-14h | Confidence 1.7 / −1 | 1 / 0 (low) |
| CS-14i | Names with extra spaces, a name over 80 characters, markup in a name | Trimmed, cut to 80, kept as plain text (never parsed) |

## CS-15 Corrections (Q16)
| Id | Input | Expected |
| --- | --- | --- |
| CS-15a | **worked** Pizza 480 (fat 17) + oil drizzle 40 (fat 4) = 520, chip Cooked in oil | 640 kcal, fat 21 → 35 g; note "Cooked in oil" |
| CS-15b | × on the drizzle | 480 kcal, one item |
| CS-15c | Swap on the pizza (Regular-crust pizza 560) | 600 kcal, item origin `swap` |
| CS-15d | Add chip "+ Cooking oil" (an item of 120 kcal) | +120 kcal, item origin `added` |
| CS-15e | Typed "+150 kcal" | +150 kcal |
| CS-15f | Typed "−100 kcal" / "-100" on a 50 kcal estimate | −100 / total 0, never negative |
| CS-15g | Typed "no rice" | Goes to the model to re-estimate |
| CS-15h | Portion 1 + / 3 + / 0.25 − / 1.1; 520 kcal at 1.5× | 1.25 / 3 / 0.25 / 1; 780 kcal |
| CS-15i | On a 400 kcal meal: Butter / Extra cheese / Extra sauce / Bigger portion / Smaller portion / Didn't finish | 500 (fat +11) / 510 / 460 / 500 / 300 / 300 |
| CS-15j | The same chip twice | Counted once |
| CS-15k | Empty note / 201 characters / "+0 kcal" | `NOTE_NOT_UNDERSTOOD` |
| CS-15l | 400 kcal + "+150 kcal", portion 2 | 950 (the typed kcal are not scaled by the portion) |

## CS-16 Meal type (Q15)
| Id | Input | Expected |
| --- | --- | --- |
| CS-16a | Toronto 3:59 / 4:00 / 8:10 / 10:59 / 11:00 / 14:59 / 15:00 / 17:00 / 21:29 / 21:30 / 22:00 | Snack / Breakfast / Breakfast / Breakfast / Lunch / Lunch / Snack / Dinner / Dinner / Snack / Snack |
| CS-16b | 2026-11-24 16:30 UTC in Toronto / in Vancouver | Lunch (11:30) / Breakfast (8:30) |

## CS-18 Food list
| Id | Input | Expected |
| --- | --- | --- |
| CS-18a | Add "Chicken" to an empty list | ok |
| CS-18b | Add "chicken" when "Chicken" is on the list | `FOOD_DUPLICATE` |
| CS-18c | Add "   " | `FOOD_EMPTY` |
| CS-18d | Add a new food to a list of 100 | `FOOD_LIST_FULL` |
| CS-18e | Add a 41-character name | `OUT_OF_RANGE` |
| CS-18f | Quick chips with "Chicken" on the list / with nothing | 16 chips from Eggs to Cheese / 16 from Chicken to Greek yogurt |
| CS-18g | "  Greek   yogurt " | Saved as "Greek yogurt" |

## CS-19 Meals (Q18)
| Id | Input | Expected |
| --- | --- | --- |
| CS-19a | Pizza, 640 kcal, P 25 C 60 F 35, portion 1.25, photo | ok |
| CS-19b | 5001 kcal | `MEAL_INVALID` (kcal) |
| CS-19c | Quick add with 0 kcal | `MEAL_INVALID` (kcal) |
| CS-19d | Empty name / 81 characters | `MEAL_INVALID` (name) |
| CS-19e | Portion 1.1 / 3.25 | `MEAL_INVALID` (portion) |
| CS-19f | 501 g protein / −1 g fat | `MEAL_INVALID` (that macro) |
| CS-19g | Today 2026-11-24: a meal of today / 11-17 / 11-16 / 11-25 | Editable / editable / not / not |

## CS-20 Tone and BMI
| Id | Input | Expected |
| --- | --- | --- |
| CS-20a | **worked** Est. 81.8 (last check-in 83.1), 178 cm | BMI 25.8, overweight |
| CS-20b | BMI 18.4 / 18.5 / 24.9 / 25.0 / 29.9 / 30.0 | Underweight / healthy / healthy / overweight / overweight / obesity |
| CS-20c | "Cheat day", "a bad day", "You failed", "guilty", "punish"; "badge", "feedback" | Found / not found |
| CS-20d | Every string in `en-CA.ts` | No banned word |
| CS-20e | Encouragement on a Too low day / an Under day | Never / allowed |
