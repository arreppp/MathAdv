-- Core schema: enums, tables, indexes. Ported from the Laravel migrations in
-- backend/database/migrations. IDs are bigint identity columns to match the
-- original bigint auto-increment ids, except users/students/teachers which
-- key off auth.users(id) (uuid).

create type public.difficulty_level as enum ('easy', 'medium', 'hard');
create type public.question_type as enum ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'drag_drop');
create type public.progress_status as enum ('locked', 'unlocked', 'in_progress', 'completed');
create type public.achievement_criteria as enum ('xp_threshold', 'level_threshold', 'levels_completed', 'perfect_score', 'streak');
create type public.badge_rarity as enum ('common', 'rare', 'epic', 'legendary');
create type public.reward_type as enum ('daily', 'level_complete', 'achievement', 'badge');
create type public.leaderboard_scope as enum ('global', 'class', 'weekly');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- roles -----------------------------------------------------------------
create table public.roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.roles
  for each row execute function public.set_updated_at();

-- users (profile row alongside auth.users) -------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role_id bigint references public.roles (id) on delete set null,
  name text not null,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.users
  for each row execute function public.set_updated_at();

-- teachers ----------------------------------------------------------------
create table public.teachers (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users (id) on delete cascade,
  school text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.teachers
  for each row execute function public.set_updated_at();

-- classes -------------------------------------------------------------------
create table public.classes (
  id bigint generated always as identity primary key,
  teacher_id bigint not null references public.teachers (id) on delete cascade,
  name text not null,
  join_code varchar(8) not null unique,
  grade_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.classes
  for each row execute function public.set_updated_at();

-- students ------------------------------------------------------------------
create table public.students (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references public.users (id) on delete cascade,
  class_id bigint references public.classes (id) on delete set null,
  date_of_birth date,
  xp integer not null default 0 check (xp >= 0),
  level smallint not null default 1 check (level between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.students
  for each row execute function public.set_updated_at();

-- question_categories ---------------------------------------------------
create table public.question_categories (
  id bigint generated always as identity primary key,
  world smallint not null check (world between 1 and 4),
  name text not null,
  slug text not null unique,
  description text,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.question_categories
  for each row execute function public.set_updated_at();

-- game_levels -------------------------------------------------------------
create table public.game_levels (
  id bigint generated always as identity primary key,
  question_category_id bigint not null references public.question_categories (id) on delete cascade,
  world smallint not null,
  level_number integer not null,
  name text not null,
  description text,
  difficulty public.difficulty_level not null default 'easy',
  xp_reward integer not null default 10,
  unlock_xp_threshold integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (world, level_number)
);
create trigger set_updated_at before update on public.game_levels
  for each row execute function public.set_updated_at();

-- questions -----------------------------------------------------------------
create table public.questions (
  id bigint generated always as identity primary key,
  question_category_id bigint not null references public.question_categories (id) on delete cascade,
  game_level_id bigint references public.game_levels (id) on delete set null,
  type public.question_type not null,
  difficulty public.difficulty_level not null default 'easy',
  prompt text not null,
  options jsonb,
  correct_answer jsonb not null,
  explanation text,
  xp_value integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();
create index questions_category_difficulty_idx on public.questions (question_category_id, difficulty);

-- player_progress -------------------------------------------------------
create table public.player_progress (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  game_level_id bigint not null references public.game_levels (id) on delete cascade,
  status public.progress_status not null default 'locked',
  stars smallint not null default 0,
  best_score integer not null default 0,
  attempts integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, game_level_id)
);
create trigger set_updated_at before update on public.player_progress
  for each row execute function public.set_updated_at();

-- game_sessions -----------------------------------------------------------
create table public.game_sessions (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  game_level_id bigint not null references public.game_levels (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  questions_answered integer not null default 0,
  correct_answers integer not null default 0,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.game_sessions
  for each row execute function public.set_updated_at();
create index game_sessions_open_idx on public.game_sessions (student_id, game_level_id, started_at desc) where ended_at is null;

-- achievements + pivot ----------------------------------------------------
create table public.achievements (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  criteria_type public.achievement_criteria not null,
  criteria_value integer not null,
  xp_reward integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.achievements
  for each row execute function public.set_updated_at();

create table public.student_achievement (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  achievement_id bigint not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, achievement_id)
);
create trigger set_updated_at before update on public.student_achievement
  for each row execute function public.set_updated_at();

-- badges + pivot ------------------------------------------------------------
create table public.badges (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  rarity public.badge_rarity not null default 'common',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.badges
  for each row execute function public.set_updated_at();

create table public.student_badge (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  badge_id bigint not null references public.badges (id) on delete cascade,
  earned_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, badge_id)
);
create trigger set_updated_at before update on public.student_badge
  for each row execute function public.set_updated_at();

-- rewards + pivot -----------------------------------------------------------
create table public.rewards (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  type public.reward_type not null,
  icon text,
  xp_value integer not null default 0,
  item_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.rewards
  for each row execute function public.set_updated_at();

create table public.student_reward (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.students (id) on delete cascade,
  reward_id bigint not null references public.rewards (id) on delete cascade,
  claimed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.student_reward
  for each row execute function public.set_updated_at();
create index student_reward_lookup_idx on public.student_reward (student_id, reward_id, claimed_at);

-- leaderboards (precompute table; currently unused, kept for parity/future use) --
create table public.leaderboards (
  id bigint generated always as identity primary key,
  scope public.leaderboard_scope not null,
  class_id bigint references public.classes (id) on delete cascade,
  student_id bigint not null references public.students (id) on delete cascade,
  period_start date,
  period_end date,
  xp integer not null,
  rank integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.leaderboards
  for each row execute function public.set_updated_at();
create index leaderboards_scope_idx on public.leaderboards (scope, class_id, period_start);

-- activity_logs ---------------------------------------------------------
create table public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users (id) on delete set null,
  student_id bigint references public.students (id) on delete set null,
  type text not null,
  description text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.activity_logs
  for each row execute function public.set_updated_at();
create index activity_logs_student_type_idx on public.activity_logs (student_id, type);
create index activity_logs_student_created_idx on public.activity_logs (student_id, created_at desc);
