-- Removes the daily-reward feature. The generic rewards/student_reward
-- tables stay (still valid schema for the unimplemented level_complete /
-- achievement / badge reward types), only the daily-specific RPCs go.

drop function if exists public.claim_daily_reward();
drop function if exists public.daily_reward_status();
