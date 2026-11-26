// The checks of docs/schema.test.sql, against a real local Supabase with its real roles and `request.jwt.claims`.
// Each test is named with the label of its check there (schema-labels.test.ts keeps the two in step). Every statement runs in
// a transaction that is rolled back, so the checks don't depend on their order.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, buildWorld, closeDb, countAs, destroyWorld, enabled, failsAs, failure, type Who, type World } from "./helpers";

const CHECK = "23514";
const FOREIGN_KEY = "23503";
const UNIQUE = "23505";
const DENIED = "42501";

describe.skipIf(!enabled)("schema checks (docs/schema.test.sql)", () => {
  let w: World;
  beforeAll(async () => {
    w = await buildWorld();
  });
  afterAll(async () => {
    if (w) await destroyWorld(w);
    await closeDb();
  });
  const owner = (sql: string) => failsAs("owner", sql);
  const user = (id: string): Who => ({ userId: id });
  const meal = (cols: string, values: string) =>
    `insert into meals (user_id, eaten_at, local_date, meal_type, name, kcal, source${cols}) values ('${w.alex}', now(), current_date, ${values})`;
  const item = (userId: string, position: number, name: string, kcal: number) =>
    `insert into meal_items (meal_id, user_id, position, name, kcal, origin) values ('${w.lunch}', '${userId}', ${position}, '${name}', ${kcal}, 'added')`;

  describe("constraints (as owner)", () => {
    it("CS-01 age under 18 refused", async () => {
      expect(await owner(`update profiles set age_years = 17 where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("CS-01 goal needs eligibility", async () => {
      expect(await owner(`update profiles set goal_weight_kg = 70 where id = '${w.bea}'`)).toBe(CHECK);
    });
    it("CS-03 goal at least 1 kg below start", async () => {
      expect(await owner(`update profiles set goal_weight_kg = 85.5 where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("CS-03 height range", async () => {
      expect(await owner(`update profiles set height_cm = 250 where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("CS-03 weight range", async () => {
      expect(await owner(`update profiles set start_weight_kg = 20 where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("CS-04 pace options only", async () => {
      expect(await owner(`update profiles set pace_kg_week = 1.5 where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("age needs its date", async () => {
      expect(await owner(`update profiles set age_recorded_on = null where id = '${w.alex}'`)).toBe(CHECK);
    });
    it("CS-04 a listed pace is accepted", async () => {
      expect(await owner(`update profiles set pace_kg_week = 0.75 where id = '${w.alex}'`)).toBeNull();
    });
    it("updated_at is touched", async () => {
      const rows = await as("owner", (query) =>
        query<{ touched: boolean }>(`update profiles set updated_at = '2000-01-01' where id = '${w.alex}' returning updated_at > '2001-01-01' as touched`),
      );
      expect(rows).toEqual([{ touched: true }]);
    });

    it("CS-18 duplicate food, any case", async () => {
      expect(await owner(`insert into liked_foods (user_id, name) values ('${w.alex}', 'chicken')`)).toBe(UNIQUE);
    });
    it("CS-18 name must be trimmed", async () => {
      expect(await owner(`insert into liked_foods (user_id, name) values ('${w.alex}', ' Eggs')`)).toBe(CHECK);
    });
    it("CS-18 empty name", async () => {
      expect(await owner(`insert into liked_foods (user_id, name) values ('${w.alex}', '')`)).toBe(CHECK);
    });
    it("CS-18 same food for another user is fine", async () => {
      expect(await owner(`insert into liked_foods (user_id, name) values ('${w.bea}', 'Chicken')`)).toBeNull();
    });

    it("CS-19 meal kcal max 5000", async () => {
      expect(await owner(meal("", "'snack', 'Huge', 6000, 'search'"))).toBe(CHECK);
    });
    it("CS-19 quick add needs kcal", async () => {
      expect(await owner(meal("", "'snack', 'Nothing', 0, 'quick_add'"))).toBe(CHECK);
    });
    it("CS-15 portion in quarter steps", async () => {
      expect(await owner(meal(", portion", "'snack', 'Odd', 100, 'search', 1.1"))).toBe(CHECK);
    });
    it("CS-15 portion max 3", async () => {
      expect(await owner(meal(", portion", "'snack', 'Big', 100, 'search', 3.25"))).toBe(CHECK);
    });
    it("confidence only on photo meals", async () => {
      expect(await owner(meal(", confidence", "'snack', 'Apple', 95, 'search', 0.9"))).toBe(CHECK);
    });
    it("CS-19 macros not negative", async () => {
      expect(await owner(meal(", protein_g", "'snack', 'Neg', 100, 'search', -1"))).toBe(CHECK);
    });
    it("CS-15 note max 200", async () => {
      expect(await owner(meal(", note", "'snack', 'Long note', 100, 'photo', repeat('x', 201)"))).toBe(CHECK);
    });
    it("CS-14 a valid photo meal is accepted", async () => {
      expect(await owner(meal(", portion, confidence", "'dinner', 'Pizza', 640, 'photo', 1.25, 0.87"))).toBeNull();
    });

    it("an item belongs to its meal's owner", async () => {
      expect(await owner(item(w.bea, 5, "Sneaky", 10))).toBe(FOREIGN_KEY);
    });
    it("CS-14 item kcal max 3000", async () => {
      expect(await owner(item(w.alex, 2, "Huge item", 3500))).toBe(CHECK);
    });
    it("one item per position", async () => {
      expect(await owner(item(w.alex, 1, "Same spot", 10))).toBe(UNIQUE);
    });

    it("CS-13 one check-in per day", async () => {
      expect(await owner(`insert into weigh_ins (user_id, measured_on, weight_kg) values ('${w.alex}', '2026-11-10', 83.0)`)).toBe(UNIQUE);
    });
    it("CS-13 weight range", async () => {
      expect(await owner(`insert into weigh_ins (user_id, measured_on, weight_kg) values ('${w.alex}', '2026-11-20', 400)`)).toBe(CHECK);
    });
    it("CS-21 demo check-in kept apart from the real one", async () => {
      expect(await owner(`insert into weigh_ins (user_id, measured_on, weight_kg, is_demo) values ('${w.alex}', '2026-11-10', 83.1, true)`)).toBeNull();
    });
  });

  describe("the view", () => {
    it("CS-08 daily total sums the day", async () => {
      const rows = await as("owner", (query) =>
        query(`select meals, kcal from daily_totals where user_id = '${w.alex}' and local_date = '2026-11-24' and not is_demo`),
      );
      expect(rows).toEqual([{ meals: 2, kcal: 900 }]);
    });
  });

  describe("deletes cascade", () => {
    it("delete a meal", async () => {
      expect(await owner(`delete from meals where id = '${w.lunch}'`)).toBeNull();
    });
    it("CS-19 removing a meal removes its items", async () => {
      const left = await as("owner", async (query) => {
        await query(`delete from meals where id = '${w.lunch}'`);
        return (await query(`select 1 from meal_items where meal_id = '${w.lunch}'`)).length;
      });
      expect(left).toBe(0);
    });
  });

  describe("as Alex (authenticated)", () => {
    const alex = () => user(w.alex);
    it("RLS a user sees only their profile", async () => expect(await countAs(alex(), "select id from profiles")).toBe(1));
    it("RLS own foods only", async () => expect(await countAs(alex(), "select id from liked_foods")).toBe(2));
    it("RLS own meals only", async () => expect(await countAs(alex(), "select id from meals")).toBe(2));
    it("RLS own check-ins only", async () => expect(await countAs(alex(), "select id from weigh_ins")).toBe(2));
    // Bea has a meal on the same day: the view shows Alex one row, his own.
    it("RLS the view applies the caller's RLS", async () => expect(await countAs(alex(), "select user_id from daily_totals")).toBe(1));
    it("RLS another user's meals are invisible", async () => expect(await countAs(alex(), `select id from meals where user_id = '${w.bea}'`)).toBe(0));
    it("scans are never readable by a client", async () => expect(await failsAs(alex(), "select * from scans")).toBe(DENIED));
    it("clients cannot insert meals", async () => {
      expect(await failsAs(alex(), meal("", "'snack', 'x', 1, 'search'"))).toBe(DENIED);
    });
    it("clients cannot update meals", async () => {
      expect(await failsAs(alex(), `update meals set kcal = 1 where id = '${w.breakfast}'`)).toBe(DENIED);
    });
    it("clients cannot delete meals", async () => {
      expect(await failsAs(alex(), `delete from meals where id = '${w.breakfast}'`)).toBe(DENIED);
    });
    it("clients cannot change their profile directly", async () => {
      expect(await failsAs(alex(), `update profiles set goal_weight_kg = 60 where id = '${w.alex}'`)).toBe(DENIED);
    });
    it("clients cannot add foods", async () => {
      expect(await failsAs(alex(), `insert into liked_foods (user_id, name) values ('${w.alex}', 'Jam')`)).toBe(DENIED);
    });
    it("clients cannot add check-ins", async () => {
      expect(await failsAs(alex(), `insert into weigh_ins (user_id, measured_on, weight_kg) values ('${w.alex}', '2026-11-25', 82)`)).toBe(DENIED);
    });
    it("clients cannot delete items", async () => expect(await failsAs(alex(), "delete from meal_items")).toBe(DENIED));
  });

  describe("anon", () => {
    it("anon cannot read profiles", async () => expect(await failsAs("anon", "select * from profiles")).toBe(DENIED));
    it("anon cannot read meals", async () => expect(await failsAs("anon", "select * from meals")).toBe(DENIED));
    it("anon cannot read daily totals", async () => expect(await failsAs("anon", "select * from daily_totals")).toBe(DENIED));
    it("anon cannot read check-ins", async () => expect(await failsAs("anon", "select * from weigh_ins")).toBe(DENIED));
  });

  describe("account deletion (T22)", () => {
    const deleteAlex = (query: Parameters<Parameters<typeof as>[1]>[0]) => query(`delete from auth.users where id = '${w.alex}'`);
    it("delete Alex's account", async () => {
      expect(await as("owner", (query) => failure(deleteAlex(query)))).toBeNull();
    });
    it("deleting the account removes every row", async () => {
      const left = await as("owner", async (query) => {
        await deleteAlex(query);
        const a = w.alex;
        return (
          await query(`select 1 from profiles where id = '${a}' union all select 1 from liked_foods where user_id = '${a}'
            union all select 1 from meals where user_id = '${a}' union all select 1 from meal_items where user_id = '${a}'
            union all select 1 from weigh_ins where user_id = '${a}' union all select 1 from scans where user_id = '${a}'`)
        ).length;
      });
      expect(left).toBe(0);
    });
    it("other users are untouched", async () => {
      const bea = await as("owner", async (query) => {
        await deleteAlex(query);
        return (await query(`select 1 from meals where user_id = '${w.bea}'`)).length;
      });
      expect(bea).toBe(1);
    });
  });
});
