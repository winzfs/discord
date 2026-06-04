type LeaderboardRow = {
  user_id: string;
  discord_id: string;
  username: string;
  global_name: string | null;
  avatar_url: string | null;
  mode: string;
  best_score: number;
  best_wave: number;
  best_run_id: string;
  updated_at: string;
};

export async function getLeaderboard(db: D1Database | undefined, mode = "single_random_wave_defense", limit = 20) {
  if (!db) {
    return {
      entries: [],
      status: "db_unavailable",
    } as const;
  }

  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const result = await db
    .prepare(
      `SELECT
        leaderboard_entries.user_id,
        users.discord_id,
        users.username,
        users.global_name,
        users.avatar_url,
        leaderboard_entries.mode,
        leaderboard_entries.best_score,
        leaderboard_entries.best_wave,
        leaderboard_entries.best_run_id,
        leaderboard_entries.updated_at
      FROM leaderboard_entries
      INNER JOIN users ON users.id = leaderboard_entries.user_id
      WHERE leaderboard_entries.season_id IS NULL AND leaderboard_entries.mode = ?
      ORDER BY leaderboard_entries.best_score DESC, leaderboard_entries.best_wave DESC, leaderboard_entries.updated_at ASC
      LIMIT ?`,
    )
    .bind(mode, safeLimit)
    .all<LeaderboardRow>();

  return {
    entries: (result.results ?? []).map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      discordId: row.discord_id,
      username: row.username,
      globalName: row.global_name ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      mode: row.mode,
      bestScore: row.best_score,
      bestWave: row.best_wave,
      bestRunId: row.best_run_id,
      updatedAt: row.updated_at,
    })),
    status: "ready",
  } as const;
}
