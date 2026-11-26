# NEXT — task list

One task per Claude Code session. Tick it when its "done when" is met; add a one-line note if you deviated or decided something.
Read CLAUDE.md + only the docs a task names.
**[phone]** = safe for a background cloud session: no secrets, no Docker, tests use fakes.
**[laptop]** = needs consoles, keys or local Supabase.
**[desk]** = done in the Claude desktop app on the laptop: the local app, the browser pane, a phone in hand.
Estimates are session time (1–2 h each).

## Where we are (2026-11-25)
- **Built:** T01 scaffold (PR #1), T02 rules (PR #2). In the repo, the starter kit: `CLAUDE.md`, `docs/DESIGN.md` (from the "Calorie Snap – App Mockup" prototype, on the owner's Next.js + Supabase stack, with the prototype's numbers as worked cases), `docs/schema.sql` + `docs/schema.test.sql` (checks passing on Postgres 16), `docs/QUESTIONS.md`.
- **Next:** T01, T02 and T03 can run in parallel as phone sessions. Q1, Q3 and Q8 should be answered before T05 and T11.

## Plan
- **Phase 0 · Foundation (T01–T04):** scaffold, CI, the numbers, database, accounts.
- **Phase 1 · The core loop (T05–T13):** sign in and eligibility, layout, Start, Profile, Today, log manually, Scan (fake, then live). Gate: the owner logs every meal for 7 days and the numbers look right.
- **Phase 2 · The full design (T14–T20):** Progress, check-ins, deficit and week, daily history and day detail, meal ideas, Foods, the simulated example.
- **Phase 3 · Private beta (T21–T24):** Home Screen install, privacy and your data, production, testers.

## Open tasks

### Phase 0 · Foundation
- [x] **T01 Scaffold the app** [phone] — done 2026-11-25 (PR #1). Railway PR environment waits for T04.
  Next.js App Router, TypeScript strict, Tailwind, zod, date-fns + @date-fns/tz, Vitest, ESLint, Playwright; exact versions (copy from `../playdate/package.json` if attached, else current stable).
  `.nvmrc` 22, `src/env.ts` (zod, fails fast; only the vars this task needs), `GET /api/health`, `.env.example`, README with the commands, `src/lib/i18n/en-CA.ts` (empty to start), Tailwind theme with the colours and radii of DESIGN.md "Visual design" (title font per Q20, self-hosted with `next/font`), a web manifest (name, green theme colour, placeholder icons).
  CI (GitHub Actions): install, lint, typecheck, test, build. Copy `security-headers.ts` (+ tests) and the CI workflow from `../playdate` if attached.
  Done when: `npm run lint && npm run typecheck && npm test && npm run build` pass locally and in CI; `/api/health` answers; the home route renders a placeholder at 375 px.

- [x] **T02 The numbers (rules)** [phone] — done 2026-11-25. Build readings (no product change, in the code comments): the estimated weight counts logged days from the check-in (or start) date through yesterday; "Calories this week" = the 7 days ending today; a model reply over 5000 kcal is scaled down to 5000; note chips apply once each and "scale" chips multiply the meal on top of the portion; typed "+N kcal" is not scaled by the portion.
  `src/lib/rules`: `types.ts` (`Decision = {ok, errors: {code, field?}[]}`, the codes in DESIGN.md), `config.ts` (activity factors, 7700 kcal/kg, minimums, pace options, cap 1%, BMI 18.5, rounding, meal-type times, note-chip adjustments reference), `time.ts` (zone passed in, clock injected; local date of an instant; days between), and modules: `profile.ts` (CS-01, 03 validation), `numbers.ts` (CS-02, 04, 05, 06, 07, 11 — burn, cap, limit, macros, timeline, estimated weight, plan line, difference, projection), `today.ts` (CS-08, 09, 16), `days.ts` (CS-10, 12 — deficits, day status, streak, week bars, "last N full days"), `estimate.ts` (CS-14, 15 — validate and clamp a model reply, apply swaps/removals/adds/chips/+N kcal, portion, totals), `foods.ts` (CS-18), `meals.ts` (CS-19), `tone.ts` (CS-20 — BMI range, banned-words check used by a test over `en-CA.ts`).
  Create `docs/rules.test-cases.md`: every row of DESIGN.md "Worked numbers from the prototype", plus edge cases per rule (female minimum, cap binding, minimum binding, no check-in, empty days, today never Too low, model reply out of range), each with an id (`CS-05b`…), input and expected result. Test names reuse the ids.
  Done when: every case in the file has a test named by its id (a test enforces it, both ways); every worked number from the prototype passes; `no-clock.test.ts` fails if anything in `src/lib/rules` reads the clock or imports I/O.

- [ ] **T03 Database: migration and tests** [phone]
  `supabase init` (ports chosen so they don't clash with Lash's, Aquatix's or Kindred's local Supabase); `supabase/migrations/0001_init.sql` = `docs/schema.sql`.
  Turn `docs/schema.test.sql` into `supabase/tests` the way Kindred did (Vitest with `pg` against local Supabase, real roles and `request.jwt.claims` instead of the stand-ins).
  CI: a `db` job that runs `supabase start` and the tests; a `types` job that generates `src/lib/db/types.ts` and fails when it drifts from the migrations.
  Done when: the CI `db` job passes every check from `docs/schema.test.sql`; `docs/schema.sql` and `schema.test.sql` get a header line saying the migration and `supabase/tests` are now the source of truth.

- [ ] **T04 Accounts: Supabase and Railway** [laptop] (mostly the owner's list)
  Staging Supabase project in its own organization (free tier needs a free slot: the owner's two free projects may be taken, see Kindred's T04); email sign-in with code (Q1); migration pushed.
  Railway project `calorie-snap` from this repo (Node 22), env vars from `.env.example`, `SITE_PASSWORD` on staging, `ANTHROPIC_API_KEY` with a monthly spend limit set in the Anthropic console. PR environments on.
  Done when: staging `/api/health` reports the database reachable, and an email code signs in on staging.

### Phase 1 · The core loop
- [ ] **T05 Sign in and eligibility** [laptop]
  Email → 6-digit code (Supabase email OTP, session in httpOnly cookies via `@supabase/ssr`; copy the code-step rules and rate limits from `../playdate` if attached). First sign-in creates the `profiles` row with the browser's time zone. The eligibility line from Start ("For adults 18+. Not for use during pregnancy or breastfeeding.") becomes a required checkbox on first save (CS-01); `eligible_confirmed_at` is set by a server action.
  Done when: a new user goes sign in → Start; a returning user lands on Today; tests cover the eligibility refusal and that a forged user id in the form is ignored.

- [ ] **T06 Layout and components** [phone]
  Components in `src/components`: Card, Button (main/secondary/dark), Chip (add/selected/dashed), Segmented, NumberedSection, Ring, MacroBar, Tile, Row (initial tile, two lines, value, ×), Toast, BottomBar (Today, Progress, raised Scan, Foods, Profile), DarkScreen (for Scan). Routes for the tabs with placeholders.
  Done when: component tests for each; a `/preview` page (behind `SITE_PASSWORD`, dev only) shows them all; works at 375 px with 44 px touch targets; the Scan button is reachable by keyboard and screen reader ("Snap your food").

- [ ] **T07 Start: foods you like** [phone]
  The Start screen exactly as DESIGN.md "Screens": add box, Added line, My food list chips with ×, Or tap to add chips (hiding chosen ones, refilling with the next suggestions), Continue / Save my list, the eligibility checkbox (T05), Just looking? → `/demo` (a placeholder until T20), Skip for now → Profile. Server actions for add/remove (CS-18).
  Done when: tests cover add, duplicate (case-insensitive), empty, list full, remove, and another user's food id being ignored.

- [ ] **T08 Profile and the daily numbers** [phone]
  Sections 1 About you, 2 Your goal (To lose tile, pace with the cap line, timeline line), 3 Your daily numbers (dark card, deficit line, ⚠ when capped or when the minimum binds), Example data (buttons disabled until T20), the NEDIC card (`tel:` and `https://nedic.ca` links) and the medical line. Numbers update as the person types (the rules run in the browser too; the server re-runs them on save). Save on change with a small "Saved" toast.
  Done when: tests cover each CS-01/03 refusal and that the saved numbers equal `numbers.ts`; the worked cases CS-02a, 04a, 05a, 06a, 07a show on screen as in the prototype.

- [ ] **T09 Today** [phone]
  Date and title, ring card (CS-08; over the limit: ring full in amber, "N kcal over"), Macros with the protein tip (CS-06, 09, Q10 wording), Meal suggestions card (button only; the ideas come in T18), Food log rows from `meals` (initial tile colour from the name, meal type · time · P C F, kcal, × with undo toast), + Add food → Scan, the burn footer. Empty state: "Nothing logged yet today. Snap your first meal." with the scan button.
  Done when: renders empty, with fake meals under the limit and over it; removing a meal updates every number; tests cover CS-08a.

- [ ] **T10 Log manually** [phone]
  Scan → Forgot a photo? Add it manually: search over the built-in catalogue (Q9; ~300 foods in `src/lib/catalog/foods.ts` with name, portion, kcal, P C F), Popular foods, Or log a recent meal (last 10 distinct meals, + adds again), Quick add (name + kcal). A picked food opens the review card: portion (CS-15 steps), Which meal? (CS-16), "After this you'll have N kcal left", Add to today. Server action `addMeal` (CS-19).
  Done when: tests cover search ranking (prefix first), quick add validation, portion maths, meal type by time, and that `addMeal` ignores a client-sent user id; the meal shows on Today.

- [ ] **T11 Scan with the fake estimate** [phone]
  The Scan screen: framing hint, shutter (file input with `capture="environment"`), Upload, Cancel; client-side shrink to 1568 px JPEG; server action `estimatePhoto` → rate limit (Q8) → `integrations/vision` (fake returns fixed estimates by a hash of the image, including a low-confidence one and a no-food one) → `estimate.ts` validation → the estimate card: confidence line, name, kcal, macro tiles, What we found (× and Swap), add chips, note chips, typed note (+N kcal handled by rules; other text → `integrations/ai` re-estimate, fake echoes a fixed change), Apply note lines, portion, meal, Retake, Add to today. One `scans` row per attempt; the photo is never written anywhere.
  Done when: tests cover CS-14 (clamping, low confidence, no food, limit reached), CS-15a (pizza 520 → 640 with Cooked in oil), every chip, Swap, ×, portion; a test asserts no `fs`/Storage call exists on the scan path; works on a real iPhone and Android camera in staging (or the laptop's local URL over the LAN).

- [ ] **T12 Live photo estimate** [laptop]
  `integrations/vision/live.ts` with the Anthropic SDK: the photo as an image block, a system prompt asking for JSON matching the zod schema (items with Canadian-style portions, a swap when a common confusion exists, a confidence), temperature 0, a 20 s timeout and one retry; errors map to `ESTIMATE_FAILED` with the Add it manually fallback. `integrations/ai/live.ts` for note re-estimates. Record model, input/output tokens on `scans`.
  Run 20 test photos (a folder `tests/photos/`, not committed if personal; list what they are in `tests/photos/README.md`) through two model tiers and write a table in the PR: name match, kcal error vs your own estimate, seconds, cost per scan. You choose the model (Q8).
  Done when: the live path works on staging from a phone; the table is in the PR; `ANTHROPIC_MODEL` is set on staging.

- [ ] **T13 Phase 1 run-through** [desk]
  The owner uses staging for 7 days: every meal logged (mostly photos), Profile filled in honestly. Note every wrong estimate, slow step and confusing word in `docs/QUESTIONS.md` or as tasks under "Later".
  Done when: 7 days logged, nothing broke, and the result is written under "Where we are".

### Phase 2 · The full design
- [ ] **T14 Progress: tiles, weight chart, projection** [phone]
  Start / Now (est.) / Goal tiles, the Weight card ("about −N kg so far"), an SVG chart (no chart library): Plan dashed, You solid with shading from the food log, check-in dots, "If you keep going" dotted to the goal date, Goal line, Today marker, legend; Projected today / You today / Difference tiles; % of the way bar; Projection card (CS-11). Empty states before 3 logged days.
  Done when: tests cover CS-11a and the chart's points for a fixed data set (snapshot of the path data); readable at 375 px; the chart has a text summary for screen readers.

- [ ] **T15 Check-ins, encouragement, BMI** [phone]
  Check-in card (CS-13; the "2 weeks ago" line), Plan vs you, the encouragement card with ↻ (Q19 lines, CS-20), BMI scale (CS-20), Weigh-ins list with changes and "Start". A new check-in re-runs the daily numbers (CS-02 uses it).
  Done when: tests cover one-per-day replacement, range refusal, the numbers changing after a check-in (CS-02b), and the banned-words test passing over all new copy.

- [ ] **T16 Calorie deficit and the week** [phone]
  The Calorie deficit card (Last N full days, total, ≈ kg, day chips, the limit line) and Calories this week (bars, limit line, avg, legend) (CS-10, 12).
  Done when: tests cover CS-10a, empty days excluded (Q13), and the week bar colours.

- [ ] **T17 Daily history and day detail** [phone]
  Daily history rows (Under / Over / Too low / Not logged, deficit, ›, the streak badge) and `/progress/day/[date]`: eaten / limit, the safe-minimum box on Too low days, deficit and fat burned, macros with "short", What you ate. Edit or remove a meal there (Q18).
  Done when: tests cover CS-10b, CS-12a, CS-12b; a day of another user returns 404.

- [ ] **T18 Meal ideas** [phone]
  Suggest a meal / Suggest another on Today (CS-17): `integrations/ai` (fake: deterministic picks from built-in templates in `src/lib/catalog/meals.ts` that combine liked foods), the card (tag, name, kcal, "You like X & Y", macros), **Log this** (Q7) into the review card. Not repeated within the day until all are shown.
  Done when: tests cover "fits kcal left", the < 150 kcal message, no food list, the protein-gap preference, and Log this.

- [ ] **T19 Foods tab** [phone]
  Add a food, Or tap to add common foods, My food list with ×, the count (same actions as T07).
  Done when: the same tests as T07 pass through this screen; a food added here shows up in the next meal ideas.

- [ ] **T20 The simulated example and /demo** [phone]
  A seeded generator (`src/lib/demo`) for 8 weeks of meals and 3 check-ins relative to today, matching the prototype's example (male, 32, 178 cm, 86.0 → 75 kg, Moderate, 0.5 kg/week; check-ins Sep 29 86.0, Oct 20 84.9, Nov 10 83.1 shifted to today). `/demo` renders every screen from it with nothing saved; signed in, Load simulated example writes demo rows (`is_demo = true`) and sets `demo_mode`; Start fresh deletes only demo rows and clears `demo_mode`. The lavender banner on every screen while in the example.
  Done when: tests show Start fresh never deletes a real row; `/demo` makes no database call; the demo's Today and Progress show the same kind of numbers as the prototype.

### Phase 3 · Private beta
- [ ] **T21 Home Screen install** [desk]. Manifest icons, service worker (offline page only; no offline logging yet), the "Add to Home Screen" hint after the third logged day (iPhone: Share → Add to Home Screen). Done when: installs on an iPhone and an Android phone and opens full screen.
- [ ] **T22 Privacy and your data** [phone]. A privacy page (what's kept, that photos aren't, the model provider, how to delete; PIPEDA wording reviewed by the owner, Q11), **Download my data** (JSON: profile, foods, meals with items and notes, check-ins; never scan rows' internals), **Delete my account** (asks first; deletes the auth user and every row by cascade). Done when: tests cover the export's contents and that delete leaves no row for that user.
- [ ] **T23 Production** [laptop]. Production Supabase and Railway environments, the domain (Q12), email sender for codes (Supabase SMTP with a real provider), Anthropic spend limit, error reporting (copy `error-report.ts`). Done when: production `/api/health` is green and an email code signs in on the real domain.
- [ ] **T24 Beta with 5–10 testers** [desk]. Invite testers (Q11), collect what they stumble on into QUESTIONS.md, watch scan costs per person. Done when: 5 testers logged for a week and the findings are written under "Where we are".

## Later
- Barcode scanning (Open Food Facts), the Canadian Nutrient File for search (Q9).
- kg/lb switch (Q2), French (Q21).
- A live in-page camera with the plate frame (`getUserMedia`).
- Apple Health / Google Fit weight import; a native wrapper if testers ask.
- Weekly summary ("Your week") and reminders (Web Push), only if testers ask.
