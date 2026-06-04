type GameRunInput = {
  mode?: string;
  score?: number;
  wave?: number;
  kills?: number;
  bossKills?: number;
  durationSeconds?: number;
  clientVersion?: string;
  resultPayload?: unknown;
};

type SavedGameRun = {
  id: string;
  userId: string;
  mode: string;
  score: number;
  wave: number;
  kills: number;
  bossKills: number;
  durationSeconds: number;
  createdAt: string;
};

function createId(prefix: string) {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeGameRunInput(input: GameRunInput): Omit<SavedGameRun, "id" | "userId" | "createdAt"> & { clientVersion?: string; resultPayload?: string } {
  return {
    mode: typeof input.mode === "string" && input.mode.length > 0 ? input.mode : "single_random_wave_defense",
    score: readNumber(input.score),
    wave: readNumber(input.wave),
    kills: readNumber(input.kills),
    bossKills: readNumber(input.bossKills),
    durationSeconds: readNumber(input.durationSeconds),
    clientVersion: typeof input.clientVersion === "string" ? input.clientVersion.slice(0, 80) : undefined,
    resultPayload: input.resultPayload === undefined ? undefined : JSON.stringify(input.resultPayload).slice(0, 8000),
  };
}

export async function saveGameRun(db: D1Database | undefined, userId: string, input: GameRunInput): Promise<SavedGameRun> {
  const normalized = normalizeGameRunInput(input);
  const id = createId("run");
  const leaderboardId = createId("leaderboard");
  const createdAt = nowIso();
  const run: SavedGameRun = { id, userId, createdAt, ...normalized };

  if (!db) return run;

  await db
    .prepare(
      `INSERT INTO game_runs (
        id, user_id, season_id, mode, score, wave, kills, boss_kills, duration_seconds, client_version, result_payload, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      normalized.mode,
      normalized.score,
      normalized.wave,
      normalized.kills,
      normalized.bossKills,
      normalized.durationSeconds,
      normalized.clientVersion ?? null,
      normalized.resultPayload ?? null,
      createdAt,
    )
    .run();

  await db
    .prepare(
      `INSERT INTO leaderboard_entries (
        id, user_id, season_id, mode, best_score, best_wave, best_run_id, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, season_id, mode) DO UPDATE SET
        best_score = excluded.best_score,
        best_wave = excluded.best_wave,
        best_run_id = excluded.best_run_id,
        updated_at = excluded.updated_at
      WHERE excluded.best_score > leaderboard_entries.best_score`,
    )
    .bind(leaderboardId, userId, normalized.mode, normalized.score, normalized.wave, id, createdAt)
    .run();

  return run;
}

export function getGameRunStatus() {
  return {
    mode: "single_random_wave_defense",
    status: "ready",
  } as const;
}
