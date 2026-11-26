# QUESTIONS — decisions still open

Each question has an id, the default we build with until it is answered, and what it affects.
When one is answered: write the answer under it with the date and who decided, update DESIGN.md (and the rule or setting), and tick it.
All of these came up while playing through the prototype (2026-11-25) and turning it into a build plan.

## Needed before Phase 1
- [ ] **Q1 How people sign in.** The prototype has no sign-in. Default: email + 6-digit code (Supabase email OTP; free, no SMS costs, no passwords), asked the first time something is saved; `/demo` needs none. Alternatives: phone code like Kindred (paid per SMS), or Sign in with Apple/Google. Affects T05.
- [ ] **Q2 Units.** The prototype is metric (kg, cm). Many Canadians weigh themselves in pounds and know their height in feet and inches. Default: metric only for Phase 1; a kg/lb and cm/ft-in switch on Profile in Phase 3 (stored metric either way).
- [ ] **Q3 Keeping meal photos.** Default: never stored; the photo goes to the model and is thrown away, and the log shows a coloured initial tile as in the prototype. Keeping them (private Storage bucket) would allow thumbnails in the log and re-estimates later, but it's more sensitive data to protect and delete.
- [ ] **Q4 Macro targets.** The prototype shows 135 g protein, 220 g carbs, 65 g fat at 2220 kcal, which only adds up to 2005 kcal. Default (CS-06): protein 1.6 g/kg, fat 0.8 g/kg, carbs = the rest (≈ 275 g in that example). Or keep carbs at 40% of the limit and let the targets not add up?
- [ ] **Q5 Safe minimum for women.** The prototype shows 1500 kcal for a man. Default: 1200 kcal for women (the usual guidance). Change either?
- [ ] **Q6 Lowest goal allowed.** The prototype doesn't limit the goal weight. Default (CS-03): the goal must be at a BMI of 18.5 or more for the height, with "That goal is below a healthy weight for your height." Different floor, or none?
- [ ] **Q8 Which model reads the photos, and a daily limit.** Default: a current Claude model with vision through `ANTHROPIC_MODEL` (Sonnet tier for accuracy; try Haiku tier for cost in T12's comparison), 30 scans per person per day (`SCANS_PER_DAY`), then "You've hit today's photo limit · add it manually". T12 records accuracy and cost per scan on 20 test photos so you can choose.
- [ ] **Q9 Where manual search gets its foods.** Default: a built-in list of ~300 common foods and meals with Canadian portions (`src/lib/catalog`), plus Quick add. Later: the Canadian Nutrient File (free, government) or Open Food Facts (barcodes). Affects T10.
- [ ] **Q11 Who it's for at first.** Just you and family, a private beta of 5–10 testers, or a public launch? Default: private beta behind `SITE_PASSWORD` until T23. A public launch needs the privacy page reviewed for PIPEDA (and Quebec Law 25 if Quebec users), and terms that say it is not medical advice.
- [ ] **Q12 Name and domain.** Is "Calorie Snap" final, checked for trademark clashes, and is a domain bought? Default: build with the Railway domain; the app name is one string in `en-CA.ts`.

## Needed in Phase 1 or 2 (defaults are fine to start)
- [ ] **Q7 Tapping a meal idea.** In the prototype the suggestion card does nothing when tapped. Default: the card gets **Log this** (opens the review card with its items, portion and meal type) next to **Suggest another**.
- [ ] **Q10 "Goal met" for fat and carbs.** The prototype says "75 / 65 g · goal met" when fat is over its target. Default: protein is a minimum ("to go" / "goal met"); carbs and fat are targets ("… to go" / "on target" within 10% / "N g over", no red).
- [ ] **Q13 Days with nothing logged.** Default (CS-10): they don't count toward deficits, the estimated weight or streaks, and show as "Not logged" in Daily history. Counting them as zero eaten would claim a full-burn deficit that didn't happen.
- [ ] **Q14 What "On plan" means.** Default: estimated weight within ±0.5 kg of the plan line; lower is "Ahead of plan", higher "Behind plan · that's OK, small steps" (no red).
- [ ] **Q15 Meal-type times.** Default (CS-16): Breakfast 4:00–10:59, Lunch 11:00–14:59, Dinner 17:00–21:29, Snack otherwise. The prototype picked Snack at 10 pm.
- [ ] **Q16 What each note chip adds.** The prototype only shows Cooked in oil (+120 kcal, 1 tbsp). Defaults for the others are in CS-15 (Butter +100, Extra cheese +110, Extra sauce +60, Bigger ×1.25, Smaller ×0.75, Didn't finish ×0.75).
- [ ] **Q17 Showing the support card beyond Profile.** Default (CS-22): after 3 Too low days within 7 days, Today shows the NEDIC card once a week. Or keep it on Profile only, as in the prototype?
- [ ] **Q18 Editing meals and logging a past day.** The prototype only removes (×). Default: tap a meal to change its portion or meal type (today and the past 7 days); adding a meal to yesterday from the day detail ("+ Add to Sunday") in Phase 2.
- [ ] **Q19 Encouragement lines.** The prototype shows one ("Small steps, every day. You are doing exactly that.") and a ↻ button. Default: 12 lines written in T15 for you to approve; none mention weight lost or food restriction.
- [ ] **Q20 The prototype's loose ends.** Its sticky note mentions "Profile · 4 Fine-tune" and "Foods · meal ideas from them", but neither is on screen. Default: no Fine-tune section (the daily numbers are automatic); meal ideas stay on Today. Also confirm the title font (looks like Space Grotesk).
- [ ] **Q21 French.** Default: English (Canada) only at launch; every string is in `en-CA.ts`, so `fr-CA.ts` can be added later.
