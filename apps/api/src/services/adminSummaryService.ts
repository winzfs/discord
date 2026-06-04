type CountRow = {
  count: number;
};

type RecentRunRow = {
  id: string;
  username: string;
  global_name: string | null;
  score: number;
  wave: number;
  kills: number;
  boss_kills: number;
  created_at: string;
};

async function countTable(db: D1Database, tableName: "users" | "game_runs") {
  const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).first<CountRow>();
  return row?.count ?? 0;
}

export async function getAdminSummary(db: D1Database | undefined) {
  if (!db) {
    return {
      status: "db_unavailable",
      totals: { users: 0, gameRuns: 0 },
      recentRuns: [],
      adminLogs: [],
    } as const;
  }

  const [userCount, gameRunCount, recentRuns] = await Promise.all([
    countTable(db, "users"),
    countTable(db, "game_runs"),
    db
      .prepare(
        `SELECT
          game_runs.id,
          users.username,
          users.global_name,
          game_runs.score,
          game_runs.wave,
          game_runs.kills,
          game_runs.boss_kills,
          game_runs.created_at
        FROM game_runs
        INNER JOIN users ON users.id = game_runs.user_id
        ORDER BY game_runs.created_at DESC
        LIMIT 10`,
      )
      .all<RecentRunRow>(),
  ]);

  return {
    status: "ready",
    totals: { users: userCount, gameRuns: gameRunCount },
    recentRuns: (recentRuns.results ?? []).map((run) => ({
      id: run.id,
      username: run.username,
      globalName: run.global_name ?? undefined,
      score: run.score,
      wave: run.wave,
      kills: run.kills,
      bossKills: run.boss_kills,
      createdAt: run.created_at,
    })),
    adminLogs: [],
  } as const;
}
