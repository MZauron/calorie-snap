-- Calorie Snap schema, draft 1 (2026-11-25). Target: Supabase Postgres 15+.
-- Source of truth for the first migration (T03 copies it to supabase/migrations/0001_init.sql).
-- Rules referenced as CS-xx are in docs/DESIGN.md.
--
-- Access model (DESIGN.md "Data access"), same as Lash, Aquatix and Kindred:
-- * Clients never write. Every write is a server action: zod -> auth.getUser() -> src/lib/rules
--   -> repository (service role), scoped to the signed-in user.
-- * The browser's role keeps SELECT on its own rows only (RLS), as a second line of defence. anon gets nothing.
-- * scans is internal (limits and costs): no client access at all.
-- * No meal photo is ever stored (Q3): there is no column or bucket for one.
-- * Constraints repeat the ranges of the rules so a bug in the server can't save an impossible value.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type sex_kind      as enum ('female', 'male');                        -- CS-02
create type activity_kind as enum ('light', 'moderate', 'active');           -- CS-02
create type meal_kind     as enum ('breakfast', 'lunch', 'dinner', 'snack'); -- CS-16
create type meal_source   as enum ('photo', 'search', 'recent', 'quick_add', 'idea');
create type item_origin   as enum ('model', 'swap', 'added', 'adjustment', 'catalog'); -- CS-15
create type scan_outcome  as enum ('ok', 'low_confidence', 'no_food', 'failed', 'limited'); -- CS-14

-- ---------------------------------------------------------------------------
-- Profile: one row per signed-in user (CS-01..07)
-- ---------------------------------------------------------------------------
create table profiles (
  id                     uuid primary key references auth.users (id) on delete cascade,
  timezone               text not null default 'America/Toronto' check (length(timezone) between 1 and 64),
  eligible_confirmed_at  timestamptz,                                   -- CS-01
  sex                    sex_kind,
  age_years              smallint check (age_years between 18 and 100), -- CS-01, CS-03
  age_recorded_on        date,
  height_cm              numeric(4,1) check (height_cm between 120 and 230),
  start_weight_kg        numeric(4,1) check (start_weight_kg between 35 and 300),
  start_date             date,
  activity               activity_kind not null default 'moderate',
  goal_weight_kg         numeric(4,1) check (goal_weight_kg between 35 and 300),
  pace_kg_week           numeric(3,2) not null default 0.5 check (pace_kg_week in (0.25, 0.5, 0.75, 1.0)), -- CS-04
  demo_mode              boolean not null default false,                -- CS-21
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint age_has_date      check ((age_years is null) = (age_recorded_on is null)),
  constraint start_has_date    check ((start_weight_kg is null) = (start_date is null)),
  constraint goal_below_start  check (goal_weight_kg is null or start_weight_kg is null or goal_weight_kg <= start_weight_kg - 1), -- CS-03
  constraint goal_needs_consent check (goal_weight_kg is null or eligible_confirmed_at is not null)                              -- CS-01
);

create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Foods the user likes (CS-18). At most 100 per user, enforced by the rules.
-- ---------------------------------------------------------------------------
create table liked_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  name        text not null check (name = btrim(name) and length(name) between 1 and 40),
  created_at  timestamptz not null default now()
);
create unique index liked_foods_unique_name on liked_foods (user_id, lower(name));

-- ---------------------------------------------------------------------------
-- Meals and their items (CS-14, 15, 16, 19)
-- ---------------------------------------------------------------------------
create table meals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  eaten_at    timestamptz not null,
  local_date  date not null,                        -- the day in profiles.timezone when added (CS-08)
  meal_type   meal_kind not null,
  name        text not null check (name = btrim(name) and length(name) between 1 and 80),
  kcal        integer not null check (kcal between 0 and 5000),
  protein_g   numeric(5,1) not null default 0 check (protein_g between 0 and 500),
  carbs_g     numeric(5,1) not null default 0 check (carbs_g between 0 and 500),
  fat_g       numeric(5,1) not null default 0 check (fat_g between 0 and 500),
  portion     numeric(3,2) not null default 1 check (portion between 0.25 and 3 and portion * 4 = floor(portion * 4)),
  source      meal_source not null,
  confidence  numeric(3,2) check (confidence between 0 and 1),
  note        text check (length(note) <= 200),     -- "Cooked in oil", kept with the meal (CS-15)
  is_demo     boolean not null default false,       -- CS-21
  created_at  timestamptz not null default now(),
  unique (id, user_id),
  constraint confidence_only_photo check (confidence is null or source = 'photo'),
  constraint quick_add_has_kcal check (source <> 'quick_add' or kcal >= 1)
);
create index meals_user_day on meals (user_id, is_demo, local_date);

create table meal_items (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null,
  user_id     uuid not null,
  position    smallint not null check (position between 0 and 49),
  name        text not null check (name = btrim(name) and length(name) between 1 and 80),
  amount      text check (length(amount) <= 40),    -- "2 slices", "1 tbsp"
  kcal        integer not null check (kcal between 0 and 3000),
  protein_g   numeric(5,1) not null default 0 check (protein_g between 0 and 300),
  carbs_g     numeric(5,1) not null default 0 check (carbs_g between 0 and 300),
  fat_g       numeric(5,1) not null default 0 check (fat_g between 0 and 300),
  origin      item_origin not null,
  foreign key (meal_id, user_id) references meals (id, user_id) on delete cascade,
  unique (meal_id, position)
);

-- ---------------------------------------------------------------------------
-- Check-ins (CS-11, CS-13): one per day (a second replaces the first)
-- ---------------------------------------------------------------------------
create table weigh_ins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles (id) on delete cascade,
  measured_on  date not null,
  weight_kg    numeric(4,1) not null check (weight_kg between 35 and 300),
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (user_id, is_demo, measured_on)
);

-- ---------------------------------------------------------------------------
-- Scans: limits and costs only (CS-14, Q8). No image, no model reply.
-- ---------------------------------------------------------------------------
create table scans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles (id) on delete cascade,
  created_at     timestamptz not null default now(),
  outcome        scan_outcome not null,
  model          text check (length(model) <= 80),
  input_tokens   integer check (input_tokens >= 0),
  output_tokens  integer check (output_tokens >= 0)
);
create index scans_user_time on scans (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Daily totals (CS-08, 10, 12). security_invoker: the caller's RLS applies.
-- ---------------------------------------------------------------------------
create view daily_totals with (security_invoker = true) as
  select user_id, is_demo, local_date,
         count(*)::int        as meals,
         sum(kcal)::int       as kcal,
         sum(protein_g)       as protein_g,
         sum(carbs_g)         as carbs_g,
         sum(fat_g)           as fat_g
  from meals
  group by user_id, is_demo, local_date;

-- ---------------------------------------------------------------------------
-- Privileges and RLS
-- ---------------------------------------------------------------------------
alter table profiles    enable row level security;
alter table liked_foods enable row level security;
alter table meals       enable row level security;
alter table meal_items  enable row level security;
alter table weigh_ins   enable row level security;
alter table scans       enable row level security;

revoke all on profiles, liked_foods, meals, meal_items, weigh_ins, scans, daily_totals from anon, authenticated;
grant select on profiles, liked_foods, meals, meal_items, weigh_ins, daily_totals to authenticated;
grant select, insert, update, delete on profiles, liked_foods, meals, meal_items, weigh_ins, scans to service_role;
grant select on daily_totals to service_role;

create policy own_profile on profiles    for select to authenticated using (id = auth.uid());
create policy own_foods   on liked_foods for select to authenticated using (user_id = auth.uid());
create policy own_meals   on meals       for select to authenticated using (user_id = auth.uid());
create policy own_items   on meal_items  for select to authenticated using (user_id = auth.uid());
create policy own_weights on weigh_ins   for select to authenticated using (user_id = auth.uid());
-- scans: no policy, no grant: clients never see it.
