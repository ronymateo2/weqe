-- Medications: persistent list of medications a user is currently taking.
-- This is a profile-level record (not a time-series log), similar to dy_drop_types.

CREATE TABLE dy_medications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL REFERENCES dy_users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  dosage       TEXT CHECK (char_length(dosage) <= 100),
  frequency    TEXT CHECK (char_length(frequency) <= 100),
  notes        TEXT CHECK (char_length(notes) <= 500),
  sort_order   INTEGER,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_dy_medications_user ON dy_medications (user_id, sort_order NULLS LAST);

ALTER TABLE dy_medications ENABLE ROW LEVEL SECURITY;

-- Defense-in-depth: all direct access denied. Server Actions use service role key.
CREATE POLICY "deny all direct access"
  ON dy_medications
  AS RESTRICTIVE
  FOR ALL
  USING (false);
