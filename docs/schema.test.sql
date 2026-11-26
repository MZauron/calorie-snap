-- HISTORICAL DRAFT: since T03 the source of truth is supabase/tests (schema.test.ts runs these checks against a real local Supabase).
-- Calorie Snap schema tests, draft 1 (2026-11-25).
-- How it is run (no Supabase needed): a scratch Postgres, the stand-ins below for Supabase's roles and auth,
-- then docs/schema.sql, then this file. Each check prints "PASS <label>" or stops with "FAIL <label>".
--   psql -d scratch -f <stand-ins> -f docs/schema.sql -f docs/schema.test.sql
-- T03 turns these into supabase/tests (Vitest with pg against local Supabase) that run in CI.
--
-- Stand-ins for Supabase (run these first, in a scratch database only):
--   create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
--   create schema auth;
--   create table auth.users (id uuid primary key, email text);
--   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.uid', true),'')::uuid $$;
--   grant usage on schema auth to anon, authenticated;
--   grant execute on function auth.uid() to anon, authenticated;
--   grant usage on schema public to anon, authenticated, service_role;

\set ON_ERROR_STOP 1
-- users: A = Alex (has data), B = Bea (another user)
insert into auth.users values
 ('aaaaaaaa-0000-0000-0000-000000000001','alex@example.com'),
 ('bbbbbbbb-0000-0000-0000-000000000002','bea@example.com');
insert into profiles(id,eligible_confirmed_at,sex,age_years,age_recorded_on,height_cm,start_weight_kg,start_date,goal_weight_kg) values
 ('aaaaaaaa-0000-0000-0000-000000000001',now(),'male',32,'2026-09-29',178,86.0,'2026-09-29',75),
 ('bbbbbbbb-0000-0000-0000-000000000002',null,null,null,null,null,null,null,null);
insert into liked_foods(user_id,name) values
 ('aaaaaaaa-0000-0000-0000-000000000001','Chicken'),('aaaaaaaa-0000-0000-0000-000000000001','Rice'),
 ('bbbbbbbb-0000-0000-0000-000000000002','Tofu');
insert into meals(id,user_id,eaten_at,local_date,meal_type,name,kcal,protein_g,carbs_g,fat_g,source,confidence,note) values
 ('11111111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','2026-11-24 13:10+00','2026-11-24','breakfast','Greek yogurt & berries',280,22,34,6,'search',null,null),
 ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','2026-11-24 17:45+00','2026-11-24','lunch','Chicken burrito bowl',620,42,68,18,'photo',0.87,'Cooked in oil'),
 ('11111111-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002','2026-11-24 17:00+00','2026-11-24','lunch','Tofu bowl',500,30,50,15,'quick_add',null,null);
insert into meal_items(meal_id,user_id,position,name,amount,kcal,protein_g,carbs_g,fat_g,origin) values
 ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',0,'Burrito bowl','1 bowl',500,42,68,4,'model'),
 ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',1,'Cooking oil','1 tbsp',120,0,0,14,'adjustment');
insert into weigh_ins(user_id,measured_on,weight_kg) values
 ('aaaaaaaa-0000-0000-0000-000000000001','2026-09-29',86.0),('aaaaaaaa-0000-0000-0000-000000000001','2026-11-10',83.1),
 ('bbbbbbbb-0000-0000-0000-000000000002','2026-11-10',70.0);
insert into scans(user_id,outcome,model,input_tokens,output_tokens) values ('aaaaaaaa-0000-0000-0000-000000000001','ok','model-x',1500,300);

create function expect_error(sql text, code text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then
    if sqlstate = code then raise notice 'PASS %', label; return; end if;
    raise exception 'FAIL % (got % %)', label, sqlstate, sqlerrm; end;
  raise exception 'FAIL % (no error)', label;
end $$;
grant execute on function expect_error(text,text,text) to authenticated, anon;
create function expect_count(sql text, n int, label text) returns void language plpgsql as $$
declare c int; begin execute 'select count(*) from ('||sql||') q' into c;
  if c = n then raise notice 'PASS % (%)', label, c; else raise exception 'FAIL % expected % got %', label, n, c; end if; end $$;
grant execute on function expect_count(text,int,text) to authenticated, anon;
create function expect_ok(sql text, label text) returns void language plpgsql as $$
begin execute sql; raise notice 'PASS %', label;
exception when others then raise exception 'FAIL % (got % %)', label, sqlstate, sqlerrm; end $$;

-- ---- constraints (as owner) ----
select expect_error($$update profiles set age_years=17 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','CS-01 age under 18 refused');
select expect_error($$update profiles set goal_weight_kg=70 where id='bbbbbbbb-0000-0000-0000-000000000002'$$,'23514','CS-01 goal needs eligibility');
select expect_error($$update profiles set goal_weight_kg=85.5 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','CS-03 goal at least 1 kg below start');
select expect_error($$update profiles set height_cm=250 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','CS-03 height range');
select expect_error($$update profiles set start_weight_kg=20 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','CS-03 weight range');
select expect_error($$update profiles set pace_kg_week=1.5 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','CS-04 pace options only');
select expect_error($$update profiles set age_recorded_on=null where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'23514','age needs its date');
select expect_ok($$update profiles set pace_kg_week=0.75 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'CS-04 a listed pace is accepted');
select expect_count($$select 1 from profiles where id='aaaaaaaa-0000-0000-0000-000000000001' and updated_at > created_at - interval '1 second'$$,1,'updated_at is touched');

select expect_error($$insert into liked_foods(user_id,name) values ('aaaaaaaa-0000-0000-0000-000000000001','chicken')$$,'23505','CS-18 duplicate food, any case');
select expect_error($$insert into liked_foods(user_id,name) values ('aaaaaaaa-0000-0000-0000-000000000001',' Eggs')$$,'23514','CS-18 name must be trimmed');
select expect_error($$insert into liked_foods(user_id,name) values ('aaaaaaaa-0000-0000-0000-000000000001','')$$,'23514','CS-18 empty name');
select expect_ok($$insert into liked_foods(user_id,name) values ('bbbbbbbb-0000-0000-0000-000000000002','Chicken')$$,'CS-18 same food for another user is fine');

select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Huge',6000,'search')$$,'23514','CS-19 meal kcal max 5000');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Nothing',0,'quick_add')$$,'23514','CS-19 quick add needs kcal');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,portion) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Odd',100,'search',1.1)$$,'23514','CS-15 portion in quarter steps');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,portion) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Big',100,'search',3.25)$$,'23514','CS-15 portion max 3');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,confidence) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Apple',95,'search',0.9)$$,'23514','confidence only on photo meals');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,protein_g) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Neg',100,'search',-1)$$,'23514','CS-19 macros not negative');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,note) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','Long note',100,'photo',repeat('x',201))$$,'23514','CS-15 note max 200');
select expect_ok($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source,portion,confidence) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'dinner','Pizza',640,'photo',1.25,0.87)$$,'CS-14 a valid photo meal is accepted');

select expect_error($$insert into meal_items(meal_id,user_id,position,name,kcal,origin) values ('11111111-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002',5,'Sneaky',10,'added')$$,'23503','an item belongs to its meal''s owner');
select expect_error($$insert into meal_items(meal_id,user_id,position,name,kcal,origin) values ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',2,'Huge item',3500,'model')$$,'23514','CS-14 item kcal max 3000');
select expect_error($$insert into meal_items(meal_id,user_id,position,name,kcal,origin) values ('11111111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001',1,'Same spot',10,'added')$$,'23505','one item per position');

select expect_error($$insert into weigh_ins(user_id,measured_on,weight_kg) values ('aaaaaaaa-0000-0000-0000-000000000001','2026-11-10',83.0)$$,'23505','CS-13 one check-in per day');
select expect_error($$insert into weigh_ins(user_id,measured_on,weight_kg) values ('aaaaaaaa-0000-0000-0000-000000000001','2026-11-20',400)$$,'23514','CS-13 weight range');
select expect_ok($$insert into weigh_ins(user_id,measured_on,weight_kg,is_demo) values ('aaaaaaaa-0000-0000-0000-000000000001','2026-11-10',83.1,true)$$,'CS-21 demo check-in kept apart from the real one');

-- ---- the view ----
select expect_count($$select 1 from daily_totals where user_id='aaaaaaaa-0000-0000-0000-000000000001' and local_date='2026-11-24' and kcal=900 and meals=2$$,1,'CS-08 daily total sums the day');

-- ---- deletes cascade ----
select expect_ok($$delete from meals where id='11111111-0000-0000-0000-000000000002'$$,'delete a meal');
select expect_count($$select 1 from meal_items where meal_id='11111111-0000-0000-0000-000000000002'$$,0,'CS-19 removing a meal removes its items');

-- ---- as Alex (authenticated) ----
set role authenticated;
select set_config('request.uid','aaaaaaaa-0000-0000-0000-000000000001',false);
select expect_count($$select 1 from profiles$$,1,'RLS a user sees only their profile');
select expect_count($$select 1 from liked_foods$$,2,'RLS own foods only');
select expect_count($$select 1 from meals$$,2,'RLS own meals only');
select expect_count($$select 1 from weigh_ins$$,3,'RLS own check-ins only');
select expect_count($$select 1 from daily_totals$$,2,'RLS the view applies the caller''s RLS');
select expect_count($$select 1 from meals where user_id='bbbbbbbb-0000-0000-0000-000000000002'$$,0,'RLS another user''s meals are invisible');
select expect_error($$select * from scans$$,'42501','scans are never readable by a client');
select expect_error($$insert into meals(user_id,eaten_at,local_date,meal_type,name,kcal,source) values ('aaaaaaaa-0000-0000-0000-000000000001',now(),current_date,'snack','x',1,'search')$$,'42501','clients cannot insert meals');
select expect_error($$update meals set kcal=1 where id='11111111-0000-0000-0000-000000000001'$$,'42501','clients cannot update meals');
select expect_error($$delete from meals where id='11111111-0000-0000-0000-000000000001'$$,'42501','clients cannot delete meals');
select expect_error($$update profiles set goal_weight_kg=60 where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'42501','clients cannot change their profile directly');
select expect_error($$insert into liked_foods(user_id,name) values ('aaaaaaaa-0000-0000-0000-000000000001','Jam')$$,'42501','clients cannot add foods');
select expect_error($$insert into weigh_ins(user_id,measured_on,weight_kg) values ('aaaaaaaa-0000-0000-0000-000000000001','2026-11-25',82)$$,'42501','clients cannot add check-ins');
select expect_error($$delete from meal_items$$,'42501','clients cannot delete items');
reset role;

-- ---- anon ----
set role anon;
select expect_error($$select * from profiles$$,'42501','anon cannot read profiles');
select expect_error($$select * from meals$$,'42501','anon cannot read meals');
select expect_error($$select * from daily_totals$$,'42501','anon cannot read daily totals');
select expect_error($$select * from weigh_ins$$,'42501','anon cannot read check-ins');
reset role;

-- ---- account deletion (T22) ----
select expect_ok($$delete from auth.users where id='aaaaaaaa-0000-0000-0000-000000000001'$$,'delete Alex''s account');
select expect_count($$select 1 from profiles where id='aaaaaaaa-0000-0000-0000-000000000001'
  union all select 1 from liked_foods where user_id='aaaaaaaa-0000-0000-0000-000000000001'
  union all select 1 from meals where user_id='aaaaaaaa-0000-0000-0000-000000000001'
  union all select 1 from weigh_ins where user_id='aaaaaaaa-0000-0000-0000-000000000001'
  union all select 1 from scans where user_id='aaaaaaaa-0000-0000-0000-000000000001'$$,0,'deleting the account removes every row');
select expect_count($$select 1 from meals where user_id='bbbbbbbb-0000-0000-0000-000000000002'$$,1,'other users are untouched');
