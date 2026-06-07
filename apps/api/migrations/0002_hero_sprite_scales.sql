CREATE TABLE IF NOT EXISTS hero_sprite_scales (
  hero_id TEXT PRIMARY KEY,
  scale REAL NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_hero_sprite_scales_updated_at
ON hero_sprite_scales(updated_at);
