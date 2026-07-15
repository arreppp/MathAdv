-- RPC functions covering auth/profile, the student game loop, dashboard,
-- achievements/rewards, and the leaderboard. Each function is a 1:1 port of
-- the matching Laravel controller action - see the file header comment on
-- 20260715120200_rls_policies.sql for why these exist as SECURITY DEFINER
-- RPCs rather than direct table access.

-- Answer-grading helpers, ported from Question::isCorrect(). -------------
create or replace function public.normalize_answer_values(p_value jsonb)
returns text[]
language sql immutable as $$
  select case
    when jsonb_typeof(p_value) = 'array' then
      array(select lower(trim(value)) from jsonb_array_elements_text(p_value) as value order by 1)
    else
      array[lower(trim(p_value #>> '{}'))]
  end;
$$;

create or replace function public.question_is_correct(p_correct jsonb, p_submitted jsonb)
returns boolean
language plpgsql immutable as $$
declare
  v_correct jsonb := p_correct;
begin
  if jsonb_typeof(v_correct) = 'array' and jsonb_array_length(v_correct) = 1 then
    v_correct := v_correct -> 0;
  end if;

  if jsonb_typeof(v_correct) = 'array' or jsonb_typeof(p_submitted) = 'array' then
    return public.normalize_answer_values(v_correct) = public.normalize_answer_values(p_submitted);
  end if;

  return lower(trim(v_correct #>> '{}')) = lower(trim(p_submitted #>> '{}'));
end;
$$;

-- Ported from Student::addXp() - flat 100xp/level curve, capped at level 100.
create or replace function public.add_student_xp(p_student_id bigint, p_amount integer)
returns void
language sql security definer set search_path = public as $$
  update public.students
  set xp = xp + p_amount,
      level = least(100, ((xp + p_amount) / 100) + 1)
  where id = p_student_id;
$$;

-- Ported from AuthController@me. ------------------------------------------
create or replace function public.me()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_user record;
  v_student jsonb;
  v_teacher jsonb;
begin
  select u.id, u.name, u.avatar, r.name as role_name
  into v_user
  from public.users u left join public.roles r on r.id = u.role_id
  where u.id = auth.uid();

  if not found then
    raise exception 'Not found.' using errcode = 'P0002';
  end if;

  select to_jsonb(s) into v_student from public.students s where s.user_id = auth.uid();
  select to_jsonb(t) into v_teacher from public.teachers t where t.user_id = auth.uid();

  return jsonb_build_object(
    'id', v_user.id, 'name', v_user.name, 'avatar', v_user.avatar, 'role', v_user.role_name,
    'student', v_student, 'teacher', v_teacher
  );
end;
$$;

-- Ported from ProgressController@summary. ----------------------------------
create or replace function public.dashboard_summary()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student public.students%rowtype;
  v_levels_completed integer;
  v_recent jsonb;
begin
  select * into v_student from public.students where user_id = auth.uid();
  if not found then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select count(*) into v_levels_completed
  from public.player_progress
  where student_id = v_student.id and status = 'completed';

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_recent
  from (
    select type, description, metadata, created_at
    from public.activity_logs
    where student_id = v_student.id
    order by created_at desc
    limit 10
  ) t;

  return jsonb_build_object(
    'student', jsonb_build_object('xp', v_student.xp, 'level', v_student.level),
    'levels_completed', v_levels_completed,
    'recent_activity', v_recent
  );
end;
$$;

-- Ported from GameLevelController@index. -----------------------------------
create or replace function public.list_levels()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student public.students%rowtype;
  v_result jsonb;
begin
  select * into v_student from public.students where user_id = auth.uid();
  if not found then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(lv) order by (lv.world), (lv.level_number)), '[]'::jsonb)
  into v_result
  from (
    select
      gl.id, gl.world, gl.level_number, gl.name, gl.description, gl.difficulty,
      gl.xp_reward, gl.unlock_xp_threshold,
      jsonb_build_object('id', qc.id, 'name', qc.name, 'slug', qc.slug) as category,
      (v_student.xp >= gl.unlock_xp_threshold) as unlocked,
      case when pp.id is null then null else jsonb_build_object(
        'status', pp.status, 'stars', pp.stars, 'best_score', pp.best_score,
        'attempts', pp.attempts, 'completed_at', pp.completed_at
      ) end as progress
    from public.game_levels gl
    join public.question_categories qc on qc.id = gl.question_category_id
    left join public.player_progress pp on pp.game_level_id = gl.id and pp.student_id = v_student.id
  ) lv;

  return v_result;
end;
$$;

-- Ported from QuestionController@next (adaptive difficulty engine). -------
create or replace function public.next_question(p_level_id bigint, p_exclude bigint default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_id bigint := public.current_student_id();
  v_level record;
  v_difficulty public.difficulty_level;
  v_tier_index int;
  v_accuracy numeric;
  v_question record;
  tiers text[] := array['easy', 'medium', 'hard'];
begin
  if v_student_id is null then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select gl.id, gl.difficulty, gl.question_category_id as category_id
  into v_level
  from public.game_levels gl
  where gl.id = p_level_id;

  if not found then
    raise exception 'Level not found.' using errcode = 'P0002';
  end if;

  v_difficulty := v_level.difficulty;

  select avg(case when (m.metadata ->> 'correct')::boolean then 1 else 0 end)
  into v_accuracy
  from (
    select metadata, created_at
    from (
      select metadata, created_at
      from public.activity_logs
      where student_id = v_student_id and type = 'question_answered'
      order by created_at desc
      limit 20
    ) recent20
    where (metadata ->> 'category_id')::bigint = v_level.category_id
    order by created_at desc
    limit 5
  ) m;

  if v_accuracy is not null then
    v_tier_index := array_position(tiers, v_difficulty::text) - 1;

    if v_accuracy >= 0.8 then
      v_tier_index := least(v_tier_index + 1, array_length(tiers, 1) - 1);
    elsif v_accuracy <= 0.4 then
      v_tier_index := greatest(v_tier_index - 1, 0);
    end if;

    v_difficulty := tiers[v_tier_index + 1]::public.difficulty_level;
  end if;

  select id, type, difficulty, prompt, options, xp_value
  into v_question
  from public.questions
  where question_category_id = v_level.category_id
    and difficulty = v_difficulty
    and (p_exclude is null or id <> p_exclude)
  order by random()
  limit 1;

  if not found then
    select id, type, difficulty, prompt, options, xp_value
    into v_question
    from public.questions
    where question_category_id = v_level.category_id
      and (p_exclude is null or id <> p_exclude)
    order by random()
    limit 1;
  end if;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_question.id, 'type', v_question.type, 'difficulty', v_question.difficulty,
    'prompt', v_question.prompt, 'options', v_question.options, 'xp_value', v_question.xp_value
  );
end;
$$;

-- Ported from ProgressController@submitAnswer (core game-loop transaction). --
create or replace function public.submit_answer(p_level_id bigint, p_question_id bigint, p_answer jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student public.students%rowtype;
  v_level record;
  v_question public.questions%rowtype;
  v_session public.game_sessions%rowtype;
  v_progress public.player_progress%rowtype;
  v_is_correct boolean;
  v_xp_awarded integer;
  v_level_completed boolean := false;
  v_accuracy numeric;
begin
  select * into v_student from public.students where user_id = auth.uid();
  if not found then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select gl.id, gl.name, gl.xp_reward, qc.name as category_name
  into v_level
  from public.game_levels gl
  join public.question_categories qc on qc.id = gl.question_category_id
  where gl.id = p_level_id;
  if not found then
    raise exception 'Level not found.' using errcode = 'P0002';
  end if;

  select * into v_question from public.questions where id = p_question_id;
  if not found then
    raise exception 'Question not found.' using errcode = 'P0002';
  end if;

  v_is_correct := public.question_is_correct(v_question.correct_answer, p_answer);
  v_xp_awarded := case when v_is_correct then v_question.xp_value else 0 end;

  select * into v_session
  from public.game_sessions
  where student_id = v_student.id and game_level_id = p_level_id and ended_at is null
  order by started_at desc
  limit 1;

  if not found then
    insert into public.game_sessions (student_id, game_level_id, started_at)
    values (v_student.id, p_level_id, now())
    returning * into v_session;
  end if;

  update public.game_sessions
  set questions_answered = questions_answered + 1,
      correct_answers = correct_answers + (case when v_is_correct then 1 else 0 end),
      xp_earned = xp_earned + (case when v_is_correct then v_xp_awarded else 0 end)
  where id = v_session.id
  returning * into v_session;

  insert into public.activity_logs (user_id, student_id, type, description, metadata)
  values (
    auth.uid(), v_student.id, 'question_answered',
    case when v_is_correct
      then 'Answered a ' || v_level.category_name || ' question correctly'
      else 'Missed a ' || v_level.category_name || ' question'
    end,
    jsonb_build_object(
      'question_id', v_question.id, 'category_id', v_question.question_category_id,
      'game_level_id', p_level_id, 'correct', v_is_correct, 'difficulty', v_question.difficulty
    )
  );

  select * into v_progress
  from public.player_progress
  where student_id = v_student.id and game_level_id = p_level_id;

  if not found then
    insert into public.player_progress (student_id, game_level_id, status)
    values (v_student.id, p_level_id, 'in_progress')
    returning * into v_progress;
  end if;

  v_progress.attempts := v_progress.attempts + 1;
  if v_progress.status in ('locked', 'unlocked') then
    v_progress.status := 'in_progress';
  end if;

  if v_is_correct and v_session.correct_answers >= 5 and v_progress.status <> 'completed' then
    v_progress.status := 'completed';
    v_progress.completed_at := now();
    v_level_completed := true;

    v_accuracy := v_session.correct_answers::numeric / greatest(1, v_session.questions_answered);
    v_progress.stars := case when v_accuracy >= 0.9 then 3 when v_accuracy >= 0.7 then 2 else 1 end;

    v_xp_awarded := v_xp_awarded + v_level.xp_reward;

    update public.game_sessions
    set xp_earned = xp_earned + v_level.xp_reward, ended_at = now()
    where id = v_session.id
    returning * into v_session;

    insert into public.activity_logs (user_id, student_id, type, description, metadata)
    values (
      auth.uid(), v_student.id, 'level_completed', 'Completed ' || v_level.name,
      jsonb_build_object('game_level_id', p_level_id, 'xp_reward', v_level.xp_reward)
    );
  end if;

  v_progress.best_score := greatest(v_progress.best_score, v_session.correct_answers);

  update public.player_progress
  set status = v_progress.status, stars = v_progress.stars, best_score = v_progress.best_score,
      attempts = v_progress.attempts, completed_at = v_progress.completed_at
  where id = v_progress.id;

  if v_xp_awarded > 0 then
    perform public.add_student_xp(v_student.id, v_xp_awarded);
    select xp, level into v_student.xp, v_student.level from public.students where id = v_student.id;
  end if;

  return jsonb_build_object(
    'correct', v_is_correct,
    'correct_answer', v_question.correct_answer,
    'explanation', v_question.explanation,
    'xp_awarded', v_xp_awarded,
    'level_completed', v_level_completed,
    'student', jsonb_build_object('xp', v_student.xp, 'level', v_student.level),
    'session', jsonb_build_object(
      'id', v_session.id, 'questions_answered', v_session.questions_answered,
      'correct_answers', v_session.correct_answers, 'xp_earned', v_session.xp_earned
    ),
    'progress', jsonb_build_object(
      'status', v_progress.status, 'stars', v_progress.stars,
      'attempts', v_progress.attempts, 'best_score', v_progress.best_score
    )
  );
end;
$$;

-- Ported from AchievementController@index. ---------------------------------
create or replace function public.list_achievements()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_id bigint := public.current_student_id();
  v_achievements jsonb;
  v_badges jsonb;
begin
  if v_student_id is null then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon,
    'xp_reward', a.xp_reward, 'earned', sa.student_id is not null
  )), '[]'::jsonb)
  into v_achievements
  from public.achievements a
  left join public.student_achievement sa on sa.achievement_id = a.id and sa.student_id = v_student_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'name', b.name, 'description', b.description, 'icon', b.icon,
    'rarity', b.rarity, 'earned', sb.student_id is not null
  )), '[]'::jsonb)
  into v_badges
  from public.badges b
  left join public.student_badge sb on sb.badge_id = b.id and sb.student_id = v_student_id;

  return jsonb_build_object('achievements', v_achievements, 'badges', v_badges);
end;
$$;

-- Ported from RewardController@dailyStatus / @claimDaily. ------------------
create or replace function public.daily_reward_status()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_id bigint := public.current_student_id();
  v_reward public.rewards%rowtype;
  v_claimed boolean;
begin
  if v_student_id is null then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select * into v_reward from public.rewards where type = 'daily' limit 1;
  if not found then
    return jsonb_build_object('message', 'No daily reward is configured yet.', 'reward', null, 'claimed_today', false);
  end if;

  select exists (
    select 1 from public.student_reward
    where student_id = v_student_id and reward_id = v_reward.id and claimed_at >= date_trunc('day', now())
  ) into v_claimed;

  return jsonb_build_object(
    'reward', jsonb_build_object('id', v_reward.id, 'name', v_reward.name, 'xp_value', v_reward.xp_value),
    'claimed_today', v_claimed
  );
end;
$$;

create or replace function public.claim_daily_reward()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_id bigint := public.current_student_id();
  v_reward public.rewards%rowtype;
  v_claimed boolean;
  v_student public.students%rowtype;
begin
  if v_student_id is null then
    raise exception 'Not a student.' using errcode = '42501';
  end if;

  select * into v_reward from public.rewards where type = 'daily' limit 1;
  if not found then
    raise exception 'No daily reward is configured yet.' using errcode = 'P0002';
  end if;

  select exists (
    select 1 from public.student_reward
    where student_id = v_student_id and reward_id = v_reward.id and claimed_at >= date_trunc('day', now())
  ) into v_claimed;

  if v_claimed then
    raise exception 'Already claimed today.' using errcode = '23505';
  end if;

  insert into public.student_reward (student_id, reward_id, claimed_at)
  values (v_student_id, v_reward.id, now());

  if v_reward.xp_value > 0 then
    perform public.add_student_xp(v_student_id, v_reward.xp_value);
  end if;

  select * into v_student from public.students where id = v_student_id;

  return jsonb_build_object(
    'message', 'Daily reward claimed.',
    'xp_awarded', v_reward.xp_value,
    'student', jsonb_build_object('xp', v_student.xp, 'level', v_student.level)
  );
end;
$$;

-- Ported from LeaderboardController@index. ---------------------------------
create or replace function public.leaderboard(p_scope text default 'global', p_class_id bigint default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_entries jsonb;
begin
  if p_scope = 'weekly' then
    return jsonb_build_object(
      'scope', 'weekly',
      'message', 'Weekly leaderboards are not computed yet - the leaderboards table exists but the recompute job has not been built.',
      'entries', '[]'::jsonb
    );
  end if;

  if p_scope = 'class' and p_class_id is null then
    raise exception 'class_id is required for scope=class.' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'rank', ranked.rn, 'student_id', ranked.id, 'name', ranked.name, 'xp', ranked.xp, 'level', ranked.level
  )), '[]'::jsonb)
  into v_entries
  from (
    select s.id, u.name, s.xp, s.level, row_number() over (order by s.xp desc) as rn
    from public.students s
    join public.users u on u.id = s.user_id
    where (p_scope <> 'class' or s.class_id = p_class_id)
    order by s.xp desc
    limit 50
  ) ranked;

  return jsonb_build_object('scope', p_scope, 'entries', v_entries);
end;
$$;
