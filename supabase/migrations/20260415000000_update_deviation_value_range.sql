-- Migrate from old friction model (-3 to +3 = mental vs logistics) to
-- new model (0 to 5 = friction intensity). Existing negative values map to
-- their absolute value (ABS), preserving magnitude without the distinction.

UPDATE dy_lid_hygiene
SET deviation_value = ABS(deviation_value)
WHERE deviation_value < 0;

ALTER TABLE dy_lid_hygiene
  DROP CONSTRAINT IF EXISTS dy_lid_hygiene_deviation_value_check;

ALTER TABLE dy_lid_hygiene
  ADD CONSTRAINT dy_lid_hygiene_deviation_value_check
    CHECK (deviation_value BETWEEN 0 AND 5);
