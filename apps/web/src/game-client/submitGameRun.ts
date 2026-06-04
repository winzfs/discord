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

export async function submitGameRun(state: GameState) {
  if (state.status !== "failed" && state.status !== "cleared") return null;

  return apiPost<SaveGameRunResponse>("/api/game/runs", {
    mode: state.mode,
    score: state.score,
    wave: state.clearedWaves,
    kills: state.defeatedEnemies,
    bossKills: state.defeatedBosses,
    durationSeconds: 0,
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
