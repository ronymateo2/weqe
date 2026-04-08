-- Drop unused index: (user_id, time_of_day) was never used in WHERE clauses.
-- Neither dashboard nor history filter by time_of_day at the DB level.
-- Adds write overhead on every check-in insert with no read benefit.
drop index if exists public.dy_check_ins_user_id_time_of_day_idx;

-- Partial index for trigger check-ins.
-- Covers targeted queries like: WHERE user_id = ? AND trigger_type IS NOT NULL
-- Used by dashboard trigger stats. Stays small as only a fraction of check-ins have trigger_type set.
create index if not exists dy_check_ins_user_id_trigger_type_idx
  on public.dy_check_ins (user_id, logged_at desc)
  where trigger_type is not null;
