-- Row-level security. Replaces Laravel's EnsureUserHasRole middleware plus
-- the per-controller `abort_unless($class->teacher_id === ...)` ownership
-- checks - both become row-level policies here.
--
-- Design: only tables a client legitimately reads/writes *directly* (via
-- supabase-js `.from()`) get policies below. Everything with real game-loop
-- business logic (questions, player_progress, game_sessions, activity_logs,
-- achievements/badges/rewards + their pivots, leaderboards) is left RLS-
-- enabled with NO policies - i.e. locked to direct access - and is only
-- reachable through the SECURITY DEFINER RPC functions in the next
-- migration, the same way those were only reachable through specific
-- controller actions before, never raw CRUD.

alter table public.roles enable row level security;
alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.question_categories enable row level security;
alter table public.game_levels enable row level security;
alter table public.questions enable row level security;
alter table public.player_progress enable row level security;
alter table public.game_sessions enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievement enable row level security;
alter table public.badges enable row level security;
alter table public.student_badge enable row level security;
alter table public.rewards enable row level security;
alter table public.student_reward enable row level security;
alter table public.leaderboards enable row level security;
alter table public.activity_logs enable row level security;

-- Helper functions (SECURITY DEFINER so they can read rows the calling
-- user's own RLS wouldn't otherwise expose to them - e.g. checking who
-- teaches a class - without recursing into the policies that call them).
create or replace function public.current_role_name()
returns text
language sql stable security definer set search_path = public as $$
  select r.name from public.users u join public.roles r on r.id = u.role_id where u.id = auth.uid();
$$;

create or replace function public.current_student_id()
returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.students where user_id = auth.uid();
$$;

create or replace function public.current_teacher_id()
returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.teachers where user_id = auth.uid();
$$;

create or replace function public.teaches_class(p_class_id bigint)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c
    where c.id = p_class_id and c.teacher_id = public.current_teacher_id()
  );
$$;

-- NOTE on the two helpers below: every RLS policy that needs to look at a
-- *different* RLS-protected table must go through a SECURITY DEFINER helper
-- like these, never a raw correlated subquery against that table directly.
-- Postgres evaluates a plain subquery under the querying role, which means
-- it re-applies that table's own RLS policies - and if those policies loop
-- back to the first table (e.g. classes <-> students below), you get
-- "infinite recursion detected in policy" at query time. SECURITY DEFINER
-- functions run as their owner (bypassing RLS for that lookup), which
-- breaks the cycle.
create or replace function public.is_student_in_class(p_class_id bigint)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.students where class_id = p_class_id and user_id = auth.uid());
$$;

create or replace function public.teaches_user(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.students s
    join public.classes c on c.id = s.class_id
    where s.user_id = p_user_id and c.teacher_id = public.current_teacher_id()
  );
$$;

-- roles: plain lookup data, readable by any authenticated user.
create policy roles_select on public.roles for select to authenticated using (true);

-- users: read your own profile, or (if you teach them) your students'.
-- Update is column-restricted below so role_id can never be self-assigned.
create policy users_select_self on public.users for select using (id = auth.uid());
create policy users_select_by_teacher on public.users for select using (public.teaches_user(id));
create policy users_update_self on public.users for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.users from authenticated;
grant update (name, avatar) on public.users to authenticated;

-- teachers: only your own row.
create policy teachers_select_self on public.teachers for select using (user_id = auth.uid());

-- classes: teacher sees/creates their own; a student sees the class they're in.
create policy classes_select_teacher on public.classes for select using (teacher_id = public.current_teacher_id());
create policy classes_select_own_student on public.classes for select using (public.is_student_in_class(id));
create policy classes_insert_teacher on public.classes for insert with check (teacher_id = public.current_teacher_id());

-- students: self, or the teacher of the class they're in. No direct
-- insert/update policy - xp/level/class_id only ever change via RPCs
-- (submit_answer, claim_daily_reward, provision_teacher) running as
-- SECURITY DEFINER, never a client-side row update.
create policy students_select_self on public.students for select using (user_id = auth.uid());
create policy students_select_by_teacher on public.students for select using (public.teaches_class(class_id));

-- question_categories / game_levels: read-only catalog data.
create policy question_categories_select on public.question_categories for select to authenticated using (true);
create policy game_levels_select on public.game_levels for select to authenticated using (true);
