-- Reference/demo content data. Ported from backend/database/seeders/*.
-- Run automatically by `supabase db reset` locally; for a remote project,
-- apply with `psql "$DATABASE_URL" -f supabase/seed.sql` after migrations.
--
-- Just like the Laravel side (`php artisan migrate --seed`), the app is not
-- usable until this has been run at least once - the 'student' role must
-- exist before anyone can register (see the on_auth_user_created trigger).

create extension if not exists pgcrypto;

-- Roles (RoleSeeder) -------------------------------------------------------
insert into public.roles (name) values ('student'), ('teacher'), ('admin')
on conflict (name) do nothing;

-- Question categories (QuestionCategorySeeder) -----------------------------
insert into public.question_categories (world, name, slug, "order") values
  (1, 'Addition', 'addition', 1),
  (1, 'Subtraction', 'subtraction', 2),
  (2, 'Multiplication', 'multiplication', 3),
  (3, 'Division', 'division', 4),
  (4, 'Fractions', 'fractions', 5)
on conflict (slug) do nothing;

-- Badges (BadgeSeeder) ------------------------------------------------------
insert into public.badges (name, slug, description, icon, rarity) values
  ('First Steps', 'first-steps', 'Complete your very first level.', 'footprints', 'common'),
  ('Addition Ace', 'addition-ace', 'Master every Addition level.', 'plus-circle', 'rare'),
  ('Subtraction Star', 'subtraction-star', 'Master every Subtraction level.', 'minus-circle', 'rare'),
  ('Perfect Score', 'perfect-score', 'Answer every question in a level correctly.', 'star', 'epic'),
  ('World 1 Champion', 'world-1-champion', 'Complete every level in Basic Arithmetic.', 'trophy', 'legendary')
on conflict (slug) do nothing;

-- World 1 game levels (GameLevelSeeder) -------------------------------------
insert into public.game_levels (question_category_id, world, level_number, name, description, difficulty, xp_reward, unlock_xp_threshold)
select qc.id, 1, lv.level_number, lv.name,
       'Solve ' || qc.name || ' challenges to advance.',
       lv.difficulty::public.difficulty_level, lv.xp_reward, lv.unlock_xp_threshold
from (values
  (1, 'addition', 'Addition Meadow', 'easy', 20, 0),
  (2, 'subtraction', 'Subtraction Swamp', 'easy', 20, 20),
  (3, 'addition', 'Addition Hills', 'medium', 30, 40),
  (4, 'subtraction', 'Subtraction Caves', 'medium', 30, 70),
  (5, 'addition', 'Arithmetic Summit', 'hard', 50, 100)
) as lv(level_number, category_slug, name, difficulty, xp_reward, unlock_xp_threshold)
join public.question_categories qc on qc.slug = lv.category_slug
on conflict (world, level_number) do update set
  question_category_id = excluded.question_category_id,
  name = excluded.name,
  description = excluded.description,
  difficulty = excluded.difficulty,
  xp_reward = excluded.xp_reward,
  unlock_xp_threshold = excluded.unlock_xp_threshold;

-- World 1 questions, procedurally generated per level (QuestionSeeder) -----
do $$
declare
  v_level record;
  v_operation text;
  v_min int;
  v_max int;
  v_a int;
  v_b int;
  v_tmp int;
  v_answer int;
  v_symbol text;
  v_xp int;
  i int;
  v_distractors int[];
  v_options text[];
  v_is_true boolean;
  v_shown int;
begin
  for v_level in
    select gl.id, gl.difficulty, gl.question_category_id, qc.slug
    from public.game_levels gl
    join public.question_categories qc on qc.id = gl.question_category_id
    where gl.world = 1
  loop
    v_operation := case when v_level.slug = 'subtraction' then 'subtract' else 'add' end;

    case v_level.difficulty
      when 'easy' then v_min := 1; v_max := 10;
      when 'medium' then v_min := 10; v_max := 50;
      when 'hard' then v_min := 50; v_max := 200;
    end case;

    v_xp := case v_level.difficulty when 'easy' then 5 when 'medium' then 8 else 12 end;

    delete from public.questions where game_level_id = v_level.id;

    -- 3 multiple_choice
    for i in 1..3 loop
      v_a := v_min + floor(random() * (v_max - v_min + 1))::int;
      v_b := v_min + floor(random() * (v_max - v_min + 1))::int;
      if v_operation = 'subtract' and v_b > v_a then
        v_tmp := v_a; v_a := v_b; v_b := v_tmp;
      end if;
      v_symbol := case when v_operation = 'add' then '+' else '-' end;
      v_answer := case when v_operation = 'add' then v_a + v_b else v_a - v_b end;

      v_distractors := array(
        select distinct d from (values
          (v_answer + (1 + floor(random() * 5))::int),
          (greatest(0, v_answer - (1 + floor(random() * 5))::int)),
          (v_answer + (6 + floor(random() * 5))::int)
        ) as t(d)
        where d <> v_answer
        limit 3
      );
      v_options := array(select unnest(v_distractors || array[v_answer])::text order by random());

      insert into public.questions
        (question_category_id, game_level_id, type, difficulty, prompt, options, correct_answer, explanation, xp_value)
      values (
        v_level.question_category_id, v_level.id, 'multiple_choice', v_level.difficulty,
        'What is ' || v_a || ' ' || v_symbol || ' ' || v_b || '?',
        to_jsonb(v_options), to_jsonb(v_answer::text),
        v_a || ' ' || v_symbol || ' ' || v_b || ' = ' || v_answer, v_xp
      );
    end loop;

    -- 2 fill_blank
    for i in 1..2 loop
      v_a := v_min + floor(random() * (v_max - v_min + 1))::int;
      v_b := v_min + floor(random() * (v_max - v_min + 1))::int;
      if v_operation = 'subtract' and v_b > v_a then
        v_tmp := v_a; v_a := v_b; v_b := v_tmp;
      end if;
      v_symbol := case when v_operation = 'add' then '+' else '-' end;
      v_answer := case when v_operation = 'add' then v_a + v_b else v_a - v_b end;

      insert into public.questions
        (question_category_id, game_level_id, type, difficulty, prompt, options, correct_answer, explanation, xp_value)
      values (
        v_level.question_category_id, v_level.id, 'fill_blank', v_level.difficulty,
        v_a || ' ' || v_symbol || ' ' || v_b || ' = ?',
        null, to_jsonb(v_answer::text),
        v_a || ' ' || v_symbol || ' ' || v_b || ' = ' || v_answer, v_xp
      );
    end loop;

    -- 1 true_false
    v_a := v_min + floor(random() * (v_max - v_min + 1))::int;
    v_b := v_min + floor(random() * (v_max - v_min + 1))::int;
    if v_operation = 'subtract' and v_b > v_a then
      v_tmp := v_a; v_a := v_b; v_b := v_tmp;
    end if;
    v_symbol := case when v_operation = 'add' then '+' else '-' end;
    v_answer := case when v_operation = 'add' then v_a + v_b else v_a - v_b end;
    v_is_true := random() < 0.5;
    v_shown := case when v_is_true then v_answer else v_answer + (1 + floor(random() * 4))::int end;

    insert into public.questions
      (question_category_id, game_level_id, type, difficulty, prompt, options, correct_answer, explanation, xp_value)
    values (
      v_level.question_category_id, v_level.id, 'true_false', v_level.difficulty,
      'True or false: ' || v_a || ' ' || v_symbol || ' ' || v_b || ' = ' || v_shown,
      to_jsonb(array['true', 'false']), to_jsonb(case when v_is_true then 'true' else 'false' end),
      v_a || ' ' || v_symbol || ' ' || v_b || ' = ' || v_answer, v_xp
    );
  end loop;
end $$;

-- Admin user (AdminUserSeeder). Inserting directly into auth.users/identities
-- is a local/dev-only recipe (bypasses the normal signup flow and GoTrue's
-- own validation) - fine for `supabase start` / CI, but for a real staging
-- or production project create the admin via the Supabase Auth Admin API
-- (supabase.auth.admin.createUser) instead, then call
-- select public.provision_teacher(...) or update role_id directly.
-- The frontend never collects a real email (see 20260727120100_unique_username.sql)
-- - it signs in with a synthetic email derived from the username. This seed
-- has to derive the admin's email the exact same way (lowercase, non
-- alphanumeric runs -> '-', trimmed, @users.mathadventura.app) or the admin
-- won't be able to log in through the normal Username field.
do $$
declare
  v_admin_id uuid;
  v_admin_name text := 'MathAdventura Admin';
  v_admin_email text := regexp_replace(regexp_replace(lower(v_admin_name), '[^a-z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')
    || '@users.mathadventura.app';
begin
  if not exists (select 1 from auth.users where email = v_admin_email) then
    v_admin_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      v_admin_email, crypt('password', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', jsonb_build_object('name', v_admin_name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_admin_id, v_admin_id::text,
      jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email),
      'email', now(), now(), now()
    );

    -- on_auth_user_created defaults every new user to student; promote to admin.
    update public.users set role_id = (select id from public.roles where name = 'admin')
    where id = v_admin_id;
    delete from public.students where user_id = v_admin_id;
  end if;
end $$;
