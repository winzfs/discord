import { initialBalance } from "@discord-random-defense/game";

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

type NormalizedGameRun = Omit<SavedGameRun, "id" | "userId" | "createdAt"> & {
  clientVersion?: string;
  resultPayload?: string;
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

function normalizeGameRunInput(input: GameRunInput): NormalizedGameRun {
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

function isSuspiciousRun(run: NormalizedGameRun) {
  if (run.mode !== "single_random_wave_defense") return true;
  if (run.wave > initialBalance.maxWave) return true;
  if (run.durationSeconds <= 0) return true;
  if (run.bossKills > Math.ceil(run.wave / initialBalance.bossWaveInterval)) return true;

  const generousKillCap = run.wave * 90 + 120;
  const generousScoreCap = run.wave * 120_000 + run.kills * 15_000 + 250_000;

  return run.kills > generousKillCap || run.score > generousScoreCap;
}

async function updateLeaderboard(db: D1Database, userId: string, run: SavedGameRun) {
  const current = await db
    .prepare(
      `SELECT id, best_score
       FROM leaderboard_entries
       WHERE user_id = ? AND season_id IS NULL AND mode = ?
       LIMIT 1`,
    )
    .bind(userId, run.mode)
    .first<{ id: string; best_score: number }>();

  if (current && current.best_score >= run.score) return;

  if (current) {
    await db
      .prepare(
        `UPDATE leaderboard_entries
         SET best_score = ?, best_wave = ?, best_run_id = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(run.score, run.wave, run.id, run.createdAt, current.id)
      .run();
    return;
  }

  await db
    .prepare(
      `INSERT INTO leaderboard_entries (
        id, user_id, season_id, mode, best_score, best_wave, best_run_id, updated_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
    )
    .bind(createId("leaderboard"), userId, run.mode, run.score, run.wave, run.id, run.createdAt)
    .run();
}

export async function saveGameRun(db: D1Database | undefined, userId: string, input: GameRunInput): Promise<SavedGameRun> {
  const normalized = normalizeGameRunInput(input);
  const suspicious = isSuspiciousRun(normalized) ? 1 : 0;
  const id = createId("run");
  const createdAt = nowIso();
  const run: SavedGameRun = { id, userId, createdAt, ...normalized };

  if (!db) return run;

  await db
    .prepare(
      `INSERT INTO game_runs (
        id, user_id, season_id, mode, score, wave, kills, boss_kills, duration_seconds, client_version, result_payload, suspicious, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      suspicious,
      createdAt,
    )
    .run();

  if (!suspicious) await updateLeaderboard(db, userId, run);
  return run;
}

export function getGameRunStatus() {
  return {
    mode: "single_random_wave_defense",
    status: "ready",
  } as const;
}
