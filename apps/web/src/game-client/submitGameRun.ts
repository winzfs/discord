import type { GameState } from "@discord-random-defense/game";
import { apiPost } from "../lib/apiClient";

type SaveGameRunResponse = {
  status: "saved";
  run: {
    id: string;
    score: number;
    wave: number;
    kills: number;
    bossKills: number;
    durationSeconds: number;
  };
};

const runStartedAt = Date.now();

function getDurationSeconds(durationSeconds?: number) {
  if (typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return Math.floor(durationSeconds);
  }
  return Math.max(1, Math.floor((Date.now() - runStartedAt) / 1000));
}

export async function submitGameRun(state: GameState, durationSeconds?: number) {
  if (state.status !== "failed" && state.status !== "cleared") return null;

  return apiPost<SaveGameRunResponse>("/api/game/runs", {
    mode: state.mode,
    score: state.score,
    wave: state.clearedWaves,
    kills: state.defeatedEnemies,
    bossKills: state.defeatedBosses,
    durationSeconds: getDurationSeconds(durationSeconds),
    clientVersion: "web-pixi-v1",
    resultPayload: {
      status: state.status,
      currentWave: state.currentWave,
      clearedWaves: state.clearedWaves,
      lives: state.lives,
      summonCount: state.summonCount,
      powerUpgradeLevel: state.powerUpgradeLevel,
    },
  });
}
