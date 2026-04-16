-- Track how many completed sessions were logged for each calendar day.
-- This replaces the need to count rows in dy_lid_hygiene for display purposes.
ALTER TABLE dy_hygiene_daily
  ADD COLUMN completed_count INTEGER NOT NULL DEFAULT 0;

-- Backfill: count completed sessions per (user_id, day_key) from the raw log
UPDATE dy_hygiene_daily d
SET completed_count = (
  SELECT COUNT(*)
  FROM dy_lid_hygiene r
  WHERE r.user_id = d.user_id
    AND r.day_key = d.day_key
    AND r.status = 'completed'
);
