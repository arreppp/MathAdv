-- Teacher-side RPCs: classes, students, analytics. Ported from
-- ClassController, StudentController, AnalyticsController.

-- Ported from ClassController@index. ---------------------------------------
create or replace function public.teacher_classes()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_teacher_id bigint := public.current_teacher_id();
begin
  if v_teacher_id is null then
    raise exception 'Not a teacher.' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'join_code', c.join_code, 'grade_level', c.grade_level,
      'students_count', (select count(*) from public.students s where s.class_id = c.id)
    ))
    from public.classes c
    where c.teacher_id = v_teacher_id
  ), '[]'::jsonb);
end;
$$;

-- Ported from ClassController@store (incl. generateJoinCode). --------------
create or replace function public.create_class(p_name text, p_grade_level text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_teacher_id bigint := public.current_teacher_id();
  v_code text;
  v_class public.classes%rowtype;
begin
  if v_teacher_id is null then
    raise exception 'Not a teacher.' using errcode = '42501';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.classes where join_code = v_code);
  end loop;

  insert into public.classes (teacher_id, name, join_code, grade_level)
  values (v_teacher_id, p_name, v_code, p_grade_level)
  returning * into v_class;

  return jsonb_build_object(
    'id', v_class.id, 'name', v_class.name, 'join_code', v_class.join_code, 'grade_level', v_class.grade_level
  );
end;
$$;

-- Ported from ClassController@show. ----------------------------------------
create or replace function public.class_detail(p_class_id bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.teaches_class(p_class_id) then
    raise exception 'This action is unauthorized.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', c.id, 'name', c.name, 'join_code', c.join_code, 'grade_level', c.grade_level,
    'students', coalesce((
      select jsonb_agg(jsonb_build_object('id', s.id, 'name', u.name, 'xp', s.xp, 'level', s.level))
      from public.students s join public.users u on u.id = s.user_id
      where s.class_id = c.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.classes c
  where c.id = p_class_id;

  return v_result;
end;
$$;

-- Ported from StudentController@index. -------------------------------------
create or replace function public.class_students(p_class_id bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches_class(p_class_id) then
    raise exception 'This action is unauthorized.' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', s.id, 'name', u.name, 'xp', s.xp, 'level', s.level,
      'levels_completed', (
        select count(*) from public.player_progress pp
        where pp.student_id = s.id and pp.status = 'completed'
      )
    ))
    from public.students s
    join public.users u on u.id = s.user_id
    where s.class_id = p_class_id
  ), '[]'::jsonb);
end;
$$;

-- Ported from AnalyticsController@classSummary. ----------------------------
create or replace function public.class_analytics(p_class_id bigint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_student_count integer;
  v_average_xp numeric;
  v_total_levels integer;
  v_completed_count integer;
  v_completion_rate numeric;
  v_category_accuracy jsonb;
  v_weakest text;
  v_strongest text;
  v_recent jsonb;
begin
  if not public.teaches_class(p_class_id) then
    raise exception 'This action is unauthorized.' using errcode = '42501';
  end if;

  select count(*), coalesce(avg(xp), 0) into v_student_count, v_average_xp
  from public.students where class_id = p_class_id;

  select count(*) into v_total_levels from public.game_levels;

  select count(*) into v_completed_count
  from public.player_progress pp
  join public.students s on s.id = pp.student_id
  where s.class_id = p_class_id and pp.status = 'completed';

  v_completion_rate := case
    when v_student_count = 0 or v_total_levels = 0 then 0
    else round((v_completed_count::numeric / (v_student_count * v_total_levels)) * 100, 1)
  end;

  select coalesce(jsonb_object_agg(category_id, accuracy), '{}'::jsonb) into v_category_accuracy
  from (
    select
      coalesce(al.metadata ->> 'category_id', 'unknown') as category_id,
      round(avg(case when (al.metadata ->> 'correct')::boolean then 1 else 0 end) * 100, 1) as accuracy
    from public.activity_logs al
    join public.students s on s.id = al.student_id
    where s.class_id = p_class_id and al.type = 'question_answered'
    group by 1
  ) cat;

  select key into v_weakest from jsonb_each(v_category_accuracy) order by (value)::numeric asc limit 1;
  select key into v_strongest from jsonb_each(v_category_accuracy) order by (value)::numeric desc limit 1;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) into v_recent
  from (
    select al.student_id, al.type, al.description, al.created_at
    from public.activity_logs al
    join public.students s on s.id = al.student_id
    where s.class_id = p_class_id
    order by al.created_at desc
    limit 15
  ) t;

  return jsonb_build_object(
    'student_count', v_student_count,
    'average_xp', round(v_average_xp, 1),
    'completion_rate_percent', v_completion_rate,
    'category_accuracy_percent', v_category_accuracy,
    'weakest_category_id', v_weakest,
    'strongest_category_id', v_strongest,
    'recent_activity', v_recent
  );
end;
$$;
