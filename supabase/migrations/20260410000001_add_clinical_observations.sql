-- dy_clinical_observations: reusable observation type definitions (not individual events)
CREATE TABLE dy_clinical_observations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT        NOT NULL REFERENCES dy_users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL DEFAULT '',
  eye        TEXT        NOT NULL DEFAULT 'none'
             CHECK (eye IN ('right', 'left', 'both', 'none')),
  notes      TEXT        CHECK (char_length(notes) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- dy_observation_occurrences: each logged occurrence of an observation type
CREATE TABLE dy_observation_occurrences (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT        NOT NULL REFERENCES dy_users(id) ON DELETE CASCADE,
  observation_id   UUID        NOT NULL REFERENCES dy_clinical_observations(id) ON DELETE CASCADE,
  logged_at        TIMESTAMPTZ NOT NULL,
  intensity        SMALLINT    NOT NULL CHECK (intensity BETWEEN 1 AND 10),
  duration_minutes SMALLINT    CHECK (duration_minutes > 0),
  notes            TEXT        CHECK (char_length(notes) <= 300),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dy_clinical_observations_user
  ON dy_clinical_observations(user_id, created_at DESC);

CREATE INDEX idx_dy_observation_occurrences_user_logged
  ON dy_observation_occurrences(user_id, logged_at DESC);

CREATE INDEX idx_dy_observation_occurrences_observation
  ON dy_observation_occurrences(observation_id, logged_at DESC);

ALTER TABLE dy_clinical_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all direct access"
  ON dy_clinical_observations
  USING (false);

ALTER TABLE dy_observation_occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all direct access"
  ON dy_observation_occurrences
  USING (false);
