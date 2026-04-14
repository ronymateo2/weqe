-- Migrate existing sleep data from dy_check_ins to dy_sleep.
-- Keeps the earliest sleep record per (user_id, calendar-day in UTC).
-- day_key is stored in UTC as a best-effort approximation —
-- user timezones cannot be resolved in plain SQL without a lookup.
INSERT INTO public.dy_sleep (user_id, day_key, logged_at, sleep_hours, sleep_quality)
SELECT DISTINCT ON (user_id, logged_at::date)
  user_id,
  logged_at::date AS day_key,
  logged_at,
  sleep_hours,
  sleep_quality
FROM public.dy_check_ins
WHERE sleep_hours IS NOT NULL
  AND sleep_quality IS NOT NULL
ORDER BY user_id, logged_at::date, logged_at
ON CONFLICT (user_id, day_key) DO NOTHING;

-- Remove sleep columns from dy_check_ins — sleep now lives in dy_sleep.
ALTER TABLE public.dy_check_ins
  DROP COLUMN IF EXISTS sleep_hours,
  DROP COLUMN IF EXISTS sleep_quality;
