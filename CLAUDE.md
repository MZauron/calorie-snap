# Calorie Snap: snap your plate, see what's left today

A mobile-first web app for adults losing weight: set a goal once, then log meals by photo (an AI estimate you can correct), by search or by a quick add; Today shows calories left, macros and meal ideas from foods you like; Progress estimates your weight from what you log, with an occasional weigh-in to keep it honest.
The product is defined by the design canvas "Calorie Snap – App Mockup" (claude.ai, interactive prototype, read 2026-11-25), summarised in `docs/DESIGN.md`. Product decisions belong to the owner: when the mock-up is silent, use the default in `docs/QUESTIONS.md` or ask; never invent product behaviour.
User-facing text: Canadian English ("colour", "favourite"), metric units as in the mock-up (Q2). Code, comments, commits, docs: English.
Solo dev, ~8 h/week plus background sessions started from a phone. Keep changes small; `main` must always be green.

## Docs (read on demand, do not preload all)
- `docs/DESIGN.md` — platform, screens, rules CS-01…CS-22, worked numbers from the prototype, data access, visual design, safety. Read the parts your task touches.
- `docs/NEXT.md` — task list. Do ONE task per session; tick it when its "done when" is met.
- `docs/QUESTIONS.md` — open decisions. Code built on an open question uses its default and says so in a comment with the id (`// Q4 default`).
- `docs/schema.sql` + `docs/schema.test.sql` — the first migration draft and its checks (T03 moves them to `supabase/`).
- `docs/rules.test-cases.md` — cases the rules must pass (created by T02, seeded from DESIGN.md "Worked numbers"). Test names reuse the ids (`CS-04a`…).

## Stack (same as Lash, Aquatix and Kindred)
- Next.js (App Router, TypeScript strict) as ONE Railway service: the app, the demo, server actions, route handlers.
- Supabase: Postgres + RLS, email sign-in with a one-time code (Q1). Its OWN projects (staging, production), never shared with another app.
- Tailwind. Zod. date-fns + @date-fns/tz. Vitest. Playwright for smoke. @anthropic-ai/sdk (server only) for the photo estimate and meal ideas.
- Node 22, npm. Pin exact versions (no `^`). Copy versions from `../playdate/package.json` when that repo is attached; otherwise the current stable release.
- Installable web app (manifest + service worker) so it opens full screen from the Home Screen. The camera is the browser's file input (`accept="image/*" capture="environment"`), which works on iPhone and Android without install.
- No cron at launch. If one is added later: Railway cron → `POST /api/cron/tick` with `Authorization: Bearer $CRON_SECRET`, idempotent.

## Layout
```
src/app/(auth)/          sign in, eligibility (CS-01)
src/app/(app)/           start (foods you like), today, scan, progress (+ day/[date]), foods, profile
src/app/demo/            the simulated example, no account, nothing saved (CS-21)
src/app/api/             health, my-data (T22)
src/lib/rules/           PURE rules: no I/O, no Date.now() (clock and zone are passed in)
src/lib/db/              server-only repositories; the only place that talks to Supabase with the service role
src/lib/domain/          services: call the rules, then the repositories (profile, meals, weigh-ins, foods, scans)
src/lib/integrations/    vision/ (photo → items), ai/ (meal ideas, note re-estimate) — each with index.ts, live.ts, fake.ts
src/lib/catalog/         built-in food list for search and quick picks (Q9), note-chip adjustments (CS-15)
src/lib/i18n/en-CA.ts    every user-facing string and the number/date formatters
src/env.ts               zod-validated env, fails fast at boot
supabase/                migrations/, seed.sql, tests/
```

## Commands (created by T01; keep this list in sync)
`npm run dev` · `build` · `lint` · `typecheck` · `test` (vitest) · `test:watch` · `test:smoke` (Playwright)
`npm run db:start` (local Supabase) · `db:stop` · `db:reset` (local only) · `db:types` (regenerate `src/lib/db/types.ts`) · `test:db`
Before every commit: `npm run lint && npm run typecheck && npm test`.

## Reusing Kindred code (optional)
- When `../playdate` (MZauron/playdate) is attached, copy rather than rewrite: `src/platform/security-headers.ts`, `rate-limit.ts`, `error-report.ts`, the `src/env.ts` pattern, the password gate (`src/lib/gate`), `scripts/test-db.sh`, the CI workflow, `Button`/`Card`/`Chip`/`Toast` as a starting point. Strip anything Kindred-specific (phones, invites, teal/coral).
- First line of a copied file: `// From MZauron/playdate <path> @ <commit>`. Copy its tests too and keep them passing.
- Never modify `../playdate` from this repo. No task may depend on it being attached.

## Conventions
- ONE place for each rule: `src/lib/rules`. Pages, server actions and the demo call it; never re-implement a number or a threshold elsewhere. Rules take data in and return values or a `Decision` with stable error codes (listed in DESIGN.md); the copy for each code lives in `en-CA.ts`.
- All the maths (burn, daily limit, macros, timelines, estimated weight, deficits) lives in `src/lib/rules/numbers.ts` and is shown exactly as computed. The demo uses the same functions.
- Units: stored metric (kg, cm, kcal, grams). Rounding happens once, in the rules, as DESIGN.md says (kcal to 10, protein to 5 g, weights to 0.1 kg).
- Time: store `timestamptz`; a meal's day is `local_date` in the user's zone (`profiles.timezone`, set from the browser, updated when it changes). Days run local midnight to midnight. Never hard-code a zone outside the rules' defaults.
- Clients never write to the database. Mutations = server actions / route handlers → zod → `auth.getUser()` → rules → repository (service role), scoped to that user. Never trust an id sent by the client.
- Integrations (vision, ai): interface in `index.ts`, `live.ts`, `fake.ts`, chosen by env (`VISION_MODE`, `AI_MODE` = `fake|live`). Tests and phone sessions use fakes. Every AI feature has a non-AI path: a failed or refused photo estimate goes to "Add it manually" with the photo's estimate empty; meal ideas fall back to built-in templates.
- Model output is untrusted data: validate it with zod, clamp numbers to the CS-14 limits, never render it as HTML.
- UI: mobile-first (works at 375 px), follow DESIGN.md "Visual design" (forest green brand, cream page, dark scan screen, 44 px touch targets). Copy is short, kind and plain; buttons say what happens. Never shame: no red for being under, no "bad day" wording (CS-20).
- Logging: ids and codes only. Never log weights, ages, meal names, notes, photos, model prompts or replies, or email addresses.
- Commits: small, imperative, English. One branch + PR per task; the Railway PR environment must boot before merge. Justify any new dependency in the PR description.

## Safety (from the mock-up; tested, never weakened)
- Adults only, not during pregnancy or breastfeeding: confirmed once before any goal is set (CS-01).
- Pace is capped at about 1% of current body weight a week (CS-04); the daily limit never goes below the safe minimum (CS-05); a goal can't be below a healthy BMI (CS-03, Q6).
- A day under the safe minimum is "Too low" with the reason, never praised (CS-12, CS-20).
- The "Food or your body feeling hard?" card (NEDIC) and the "estimates, not medical advice" line are always on Profile (CS-22).

## Privacy
- Weight, age, sex, height and meals are health information: private to their owner (RLS, tested), never shown to anyone else, never logged.
- Photos are sent to the model and thrown away; nothing stores them (Q3).
- The model gets the photo and the user's correction note only: no name, email, weight or account id.
- Download my data and Delete my account before the beta (T22).

## Secrets and environments
- Secrets live in Railway variables and `.env.local` (gitignored). `.env.example` lists names only.
- Browser-visible: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` only.
- Server only: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (Q8), `SCANS_PER_DAY` (Q8).
- `SITE_PASSWORD` (optional): the password curtain from Kindred for staging and demos; `/demo` is outside it.
- Development signs in through local Supabase's Inbucket mail; no real email provider until Q1 is decided.

## NEVER do
- Never put the service-role key or any API key in client code, `NEXT_PUBLIC_*`, logs or commits.
- Never show a daily limit below the safe minimum or a pace above the cap, and never let a goal past the CS-03 limits be saved.
- Never store a meal photo, or send the model anything but the photo and the user's note.
- Never write praise, streaks or "on target" for a Too low day; never use shaming words (cheat, bad, failed, guilty).
- Never disable RLS, add a permissive policy, grant a client INSERT/UPDATE/DELETE, or use the service role on a path a client can steer without checking ownership first.
- Never use local-timezone `Date` math or `Date.now()` inside `src/lib/rules`.
- Never hard-code user-facing strings in components.
- Never edit an applied migration; never run destructive SQL, `db:reset` or `git push --force` against anything but local.
- Never start unrelated refactors or features beyond the current NEXT.md task; note ideas in NEXT.md "Later".

## Session hygiene (Max plan)
Read only the files the task needs. Prefer pure-function work + tests for background sessions (no secrets, no Docker).
Stop and report when blocked by a missing credential or an open question in QUESTIONS.md that changes the task.

## Before starting a task
`git fetch origin`, check open PRs and remote branches, read the latest `docs/NEXT.md` and `git log origin/main`.
If the task is merged, has an open PR or a branch, STOP and say so. Branch from fresh `origin/main`.
