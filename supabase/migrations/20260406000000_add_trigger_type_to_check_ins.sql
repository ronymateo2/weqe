-- Add trigger_type column to dy_check_ins so triggers can be associated with pain data
ALTER TABLE public.dy_check_ins ADD COLUMN trigger_type text NULL;

-- Constraint: must be a valid trigger type when set
ALTER TABLE public.dy_check_ins ADD CONSTRAINT dy_check_ins_trigger_type_check
  CHECK (
    trigger_type IS NULL OR trigger_type = ANY(ARRAY[
      'climate'::text,
      'humidifier'::text,
      'stress'::text,
      'screens'::text,
      'tv'::text,
      'ergonomics'::text,
      'exercise'::text,
      'other'::text
    ])
  );

-- Add 'trigger' as a valid time_of_day value (keep 'other' for backward compat)
ALTER TABLE public.dy_check_ins DROP CONSTRAINT dy_check_ins_time_of_day_check;
ALTER TABLE public.dy_check_ins ADD CONSTRAINT dy_check_ins_time_of_day_check
  CHECK (
    time_of_day = ANY(ARRAY['morning'::text, 'evening'::text, 'other'::text, 'trigger'::text])
  );
