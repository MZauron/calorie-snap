// From MZauron/playdate supabase/tests/helpers.ts @ eeb9dd8 (Kindred's world replaced by Calorie Snap's).
// Shared by the database tests. They talk to a real local Postgres (Supabase's, via scripts/test-db.sh) and are skipped unless
// `CS_DB_TESTS=1`, so `npm test` needs no database.
//
// Every run makes its own users with random ids and deletes them afterwards: nothing seeded is touched and two runs cannot
// disturb each other. Reads "as a role" work the way Supabase's Data API does: inside a transaction, `set local role` plus the
// JWT claims `auth.uid()` reads, so what they prove is what production enforces.
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export const enabled = process.env.CS_DB_TESTS === "1";

let pool: Pool | undefined;
export const db = (): Pool => {
  const connectionString = process.env.CS_DB_URL;
  if (!connectionString) throw new Error("CS_DB_URL is not set: run these tests with scripts/test-db.sh");
  return (pool ??= new Pool({ connectionString, max: 8 }));
};
export const closeDb = async () => {
  await pool?.end();
  pool = undefined;
};

type Params = unknown[];
export type Query = <R extends QueryResultRow = Record<string, unknown>>(sql: string, params?: Params) => Promise<R[]>;

/** A query as the database owner (bypasses row-level security), for building worlds and for the constraint tests. */
export async function q<T extends QueryResultRow = Record<string, unknown>>(sql: string, params: Params = []): Promise<T[]> {
  return (await db().query<T>(sql, params)).rows;
}

/** The SQLSTATE (and message) a statement fails with, or null when it succeeds. */
export async function failure(run: Promise<unknown>): Promise<{ code: string; message: string } | null> {
  try {
    await run;
    return null;
  } catch (error) {
    const { code, message } = error as { code?: string; message: string };
    return { code: code ?? "", message };
  }
}

export type Who = "owner" | "anon" | "service" | { userId: string };

/**
 * Runs `fn` inside a transaction, then rolls back, so nothing it writes outlives it. As "owner" it is the database owner;
 * otherwise a Data API role (`{ userId }` is a signed-in user, role `authenticated`).
 */
export async function as<T>(who: Who, fn: (query: Query) => Promise<T>): Promise<T> {
  const client: PoolClient = await db().connect();
  try {
    await client.query("begin");
    if (who !== "owner") {
      const role = who === "anon" ? "anon" : who === "service" ? "service_role" : "authenticated";
      await client.query(`set local role ${role}`);
      if (typeof who === "object") {
        await client.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: who.userId, role: "authenticated" })]);
      }
    }
    return await fn(async (sql, params = []) => (await client.query(sql, params)).rows);
  } finally {
    await client.query("rollback").catch(() => undefined);
    client.release();
  }
}

/** How many rows a role sees for a query. */
export const countAs = (who: Who, sql: string): Promise<number> => as(who, async (query) => (await query(sql)).length);

/** The SQLSTATE a statement fails with when run as a role (rolled back), or null when it succeeds. */
export const failsAs = async (who: Who, sql: string): Promise<string | null> => (await as(who, (query) => failure(query(sql))))?.code ?? null;

export type World = Awaited<ReturnType<typeof buildWorld>>;

/**
 * The world of docs/schema.test.sql, with fresh ids. Alex has a full profile (eligible, goal 75), two liked foods, two meals on
 * 2026-11-24 (one from a photo with two items), two check-ins and a scan. Bea is another user with an empty profile, one food,
 * one meal and one check-in.
 */
export async function buildWorld() {
  const id = () => randomUUID();
  const w = { alex: id(), bea: id(), breakfast: id(), lunch: id(), beaLunch: id(), tag: randomUUID().slice(0, 8) };
  await q("insert into auth.users (id, email) values ($1, $2), ($3, $4)", [w.alex, `alex-${w.tag}@example.test`, w.bea, `bea-${w.tag}@example.test`]);
  await q(
    `insert into profiles (id, eligible_confirmed_at, sex, age_years, age_recorded_on, height_cm, start_weight_kg, start_date, goal_weight_kg)
     values ($1, now(), 'male', 32, '2026-09-29', 178, 86.0, '2026-09-29', 75), ($2, null, null, null, null, null, null, null, null)`,
    [w.alex, w.bea],
  );
  await q("insert into liked_foods (user_id, name) values ($1, 'Chicken'), ($1, 'Rice'), ($2, 'Tofu')", [w.alex, w.bea]);
  await q(
    `insert into meals (id, user_id, eaten_at, local_date, meal_type, name, kcal, protein_g, carbs_g, fat_g, source, confidence, note) values
     ($1, $2, '2026-11-24 13:10+00', '2026-11-24', 'breakfast', 'Greek yogurt & berries', 280, 22, 34, 6, 'search', null, null),
     ($3, $2, '2026-11-24 17:45+00', '2026-11-24', 'lunch', 'Chicken burrito bowl', 620, 42, 68, 18, 'photo', 0.87, 'Cooked in oil'),
     ($4, $5, '2026-11-24 17:00+00', '2026-11-24', 'lunch', 'Tofu bowl', 500, 30, 50, 15, 'quick_add', null, null)`,
    [w.breakfast, w.alex, w.lunch, w.beaLunch, w.bea],
  );
  await q(
    `insert into meal_items (meal_id, user_id, position, name, amount, kcal, protein_g, carbs_g, fat_g, origin) values
     ($1, $2, 0, 'Burrito bowl', '1 bowl', 500, 42, 68, 4, 'model'), ($1, $2, 1, 'Cooking oil', '1 tbsp', 120, 0, 0, 14, 'adjustment')`,
    [w.lunch, w.alex],
  );
  await q(
    "insert into weigh_ins (user_id, measured_on, weight_kg) values ($1, '2026-09-29', 86.0), ($1, '2026-11-10', 83.1), ($2, '2026-11-10', 70.0)",
    [w.alex, w.bea],
  );
  await q("insert into scans (user_id, outcome, model, input_tokens, output_tokens) values ($1, 'ok', 'model-x', 1500, 300)", [w.alex]);
  return w;
}

/** Deletes everything a world made: removing the users cascades to profiles and everything they own. */
export async function destroyWorld(w: World): Promise<void> {
  await q("delete from auth.users where id = any($1)", [[w.alex, w.bea]]);
}
