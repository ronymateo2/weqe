CREATE TABLE dy_lid_hygiene (
  id              UUID        PRIMARY KEY,
  user_id         TEXT        NOT NULL REFERENCES dy_users(id) ON DELETE CASCADE,
  day_key         DATE        NOT NULL,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          TEXT        NOT NULL CHECK (status IN ('completed', 'skipped', 'partial')),
  deviation_value INTEGER     NOT NULL CHECK (deviation_value BETWEEN -3 AND 3),
  friction_type   TEXT        NOT NULL CHECK (friction_type IN ('mental', 'logistics', 'none')),
  user_note       TEXT
);

CREATE INDEX ON dy_lid_hygiene (user_id, day_key DESC);
CREATE INDEX ON dy_lid_hygiene (user_id, logged_at DESC);

ALTER TABLE dy_lid_hygiene ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON dy_lid_hygiene USING (false);
