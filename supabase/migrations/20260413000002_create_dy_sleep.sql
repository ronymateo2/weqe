-- Standalone daily sleep record.
-- One row per user per calendar-day (in user's timezone).
-- day_key is computed server-side using the user's stored timezone.
CREATE TABLE public.dy_sleep (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL REFERENCES public.dy_users(id) ON DELETE CASCADE,
  day_key       DATE NOT NULL,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  sleep_hours   NUMERIC(3,1) NOT NULL CHECK (sleep_hours BETWEEN 0 AND 12),
  sleep_quality TEXT NOT NULL CHECK (
    sleep_quality IN ('muy_malo', 'malo', 'regular', 'bueno', 'excelente')
  ),
  UNIQUE (user_id, day_key)
);

CREATE INDEX dy_sleep_user_day_idx ON public.dy_sleep (user_id, day_key DESC);

ALTER TABLE public.dy_sleep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_all" ON public.dy_sleep FOR ALL USING (false);
