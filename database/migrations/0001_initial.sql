CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  global_name TEXT,
  avatar_url TEXT,
  is_guild_member INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  rule_set_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS game_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_name TEXT,
  season_id TEXT,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  reached_wave INTEGER NOT NULL,
  cleared_waves INTEGER NOT NULL,
  defeated_enemies INTEGER NOT NULL,
  defeated_bosses INTEGER NOT NULL,
  remaining_lives INTEGER NOT NULL,
  survived INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  client_version TEXT,
  result_payload TEXT,
  suspicious INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id)
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  guest_name TEXT,
  season_id TEXT,
  mode TEXT NOT NULL,
  best_score INTEGER NOT NULL,
  best_wave INTEGER NOT NULL,
  best_run_id TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (season_id) REFERENCES seasons(id),
  FOREIGN KEY (best_run_id) REFERENCES game_runs(id)
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  payload TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_game_runs_score ON game_runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_runs_created_at ON game_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_score ON leaderboard_entries(best_score DESC);
