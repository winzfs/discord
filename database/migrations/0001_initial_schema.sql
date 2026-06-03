-- Cloudflare D1 initial schema draft for the single-player random defense MVP.
-- OAuth/session implementation and repository query code will be added in later stages.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  season_id TEXT,
  mode TEXT NOT NULL DEFAULT 'single_random_wave_defense',
  seed TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  reached_wave INTEGER NOT NULL DEFAULT 1,
  defeated_enemies INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  result_payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  season_id TEXT,
  game_run_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  reached_wave INTEGER NOT NULL,
  rank_scope TEXT NOT NULL DEFAULT 'global',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (game_run_id) REFERENCES game_runs(id)
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game_runs_user_created_at ON game_runs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(rank_scope, score DESC, reached_wave DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
