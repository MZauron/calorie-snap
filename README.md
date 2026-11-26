# Calorie Snap

Snap your plate, see what's left today. A mobile-first web app built from the "Calorie Snap – App Mockup" prototype.

- `CLAUDE.md`: how Claude Code works in this repo (stack, conventions, safety, never-do list).
- `docs/DESIGN.md`: screens, rules CS-01…CS-22, the prototype's numbers as worked cases, data access, visual design.
- `docs/NEXT.md`: tasks T01…T24.
- `docs/QUESTIONS.md`: open decisions with the default used until answered.
- `supabase/migrations` + `supabase/tests`: the database and its checks (`docs/schema*.sql` are the historical drafts).

Stack: Next.js on Railway, Supabase (own project), Anthropic API for the photo estimate. Node 22 (`.nvmrc`), npm, exact versions.

## Commands
| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `npm run test:watch` | Vitest |
| `npm run test:smoke` | Playwright smoke tests against a production build at 375 px (run `npx playwright install webkit` once) |
| `npm run db:start` / `db:stop` | Local Supabase in Docker (ports 54620–54629, so it runs beside Lash, Aquatix and Kindred) |
| `npm run db:reset` | Rebuild the LOCAL database from `supabase/migrations` and `supabase/seed.sql` |
| `npm run db:types` | Regenerate `src/lib/db/types.ts` from the local database (commit it; CI fails when it drifts) |
| `npm run test:db` | Database tests in `supabase/tests` against the local Supabase (`db:start` first) |

Before every commit: `npm run lint && npm run typecheck && npm test`. Copy `.env.example` to `.env.local` when a task needs variables.

To try it from a phone on the same Wi-Fi: set `DEV_ORIGINS` in `.env.local` to the laptop's address (`ipconfig getifaddr en0`), then run `npx next dev -H 0.0.0.0`.
