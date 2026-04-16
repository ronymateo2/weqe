-- One canonical row per (user_id, day_key).
-- This is a write-through cache over dy_lid_hygiene — the raw log stays intact
-- for offline upsert-by-id idempotency. All dashboard/history reads use this table.
CREATE TABLE dy_hygiene_daily (
  user_id         TEXT        NOT NULL REFERENCES dy_users(id) ON DELETE CASCADE,
  day_key         DATE        NOT NULL,
  status          TEXT        NOT NULL CHECK (status IN ('completed', 'skipped', 'partial')),
  deviation_value INTEGER     CHECK (deviation_value BETWEEN 0 AND 5),
  friction_type   TEXT        CHECK (friction_type IN ('mental', 'logistics', 'none')),
  user_note       TEXT,
  last_logged_at  TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, day_key)
);

CREATE INDEX ON dy_hygiene_daily (user_id, day_key DESC);
ALTER TABLE dy_hygiene_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON dy_hygiene_daily USING (false);

-- Per-user aggregate stats: cycle anchor + all-time completed day counter.
-- Dashboard reads one row → O(1) for both stats.
CREATE TABLE dy_hygiene_stats (
  user_id              TEXT    PRIMARY KEY REFERENCES dy_users(id) ON DELETE CASCADE,
  first_day_key        DATE    NOT NULL,
  total_completed_days INTEGER NOT NULL DEFAULT 0,
  last_updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE dy_hygiene_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON dy_hygiene_stats USING (false);

-- Backfill dy_hygiene_daily: latest event per (user_id, day_key)
INSERT INTO dy_hygiene_daily (user_id, day_key, status, deviation_value, friction_type, user_note, last_logged_at)
SELECT DISTINCT ON (user_id, day_key)
  user_id, day_key, status, deviation_value, friction_type, user_note, logged_at
FROM dy_lid_hygiene
ORDER BY user_id, day_key, logged_at DESC
ON CONFLICT DO NOTHING;

-- Backfill dy_hygiene_stats from the already-deduped daily summary
INSERT INTO dy_hygiene_stats (user_id, first_day_key, total_completed_days)
SELECT
  user_id,
  MIN(day_key) AS first_day_key,
  COUNT(*) FILTER (WHERE status = 'completed') AS total_completed_days
FROM dy_hygiene_daily
GROUP BY user_id
ON CONFLICT DO NOTHING;
