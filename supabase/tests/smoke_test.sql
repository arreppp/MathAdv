-- CI smoke test: exercises the auth-provisioning trigger, the RLS policies
-- (specifically checking for the students<->classes recursion this schema
-- had once - see git history on 20260715120200_rls_policies.sql), and the
-- core game-loop RPC end to end. Fails the build (via ON_ERROR_STOP) if any
-- step errors or an assertion doesn't hold.

\set ON_ERROR_STOP on

insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'ci-student@test.dev', '{"name":"CI Student"}');

do $$
begin
  if not exists (select 1 from public.students where user_id = '11111111-1111-1111-1111-111111111111') then
    raise exception 'on_auth_user_created did not provision a students row';
  end if;
end $$;

-- Snapshot correct answers as postgres before switching role - questions
-- has zero RLS policies (locked to RPC-only access), so a client can't read
-- correct_answer directly; this is just to know what to submit in the test.
create temp table qa as select id, correct_answer from public.questions;
grant select on qa to authenticated;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

-- Would raise "infinite recursion detected in policy" if that bug regresses.
select count(*) as own_student_row_count from public.students;

do $$
declare
  v_level_id bigint;
  q jsonb;
  correct jsonb;
  result jsonb;
begin
  select id into v_level_id from public.game_levels where world = 1 and level_number = 1;
  q := public.next_question(v_level_id);

  if q is null then
    raise exception 'next_question returned no question for level 1 - seed data missing?';
  end if;

  select qa.correct_answer into correct from qa where qa.id = (q ->> 'id')::bigint;
  result := public.submit_answer(v_level_id, (q ->> 'id')::bigint, correct);

  if not (result ->> 'correct')::boolean then
    raise exception 'submit_answer graded a known-correct answer as incorrect';
  end if;
end $$;

reset role;
reset request.jwt.claim.sub;

select 'smoke test passed' as result;
