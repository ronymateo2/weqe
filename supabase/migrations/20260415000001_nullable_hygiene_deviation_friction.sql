-- Make deviation_value and friction_type nullable so a hygiene session
-- can be saved immediately without requiring calibration data.
-- Calibration is optional and gets upserted separately when the user fills it in.

ALTER TABLE public.dy_lid_hygiene
  ALTER COLUMN deviation_value DROP NOT NULL,
  ALTER COLUMN friction_type   DROP NOT NULL;
