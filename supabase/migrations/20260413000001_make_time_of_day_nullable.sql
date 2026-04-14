-- Make time_of_day nullable.
-- Time of day is now optional metadata — check-in registration is free.
-- Existing rows are unaffected. New rows may omit this field.
ALTER TABLE public.dy_check_ins
  ALTER COLUMN time_of_day DROP NOT NULL;
