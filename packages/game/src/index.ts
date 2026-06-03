export * from "./data/balance";
export * from "./data/enemies";
export * from "./data/heroes";
export * from "./data/skills";
export * from "./data/waves";
export * from "./rules/scoring";
export * from "./systems/combatSystem";
export * from "./systems/mergeSystem";
export * from "./systems/summonSystem";
export * from "./systems/waveSystem";
export * from "./types/enemy";
export * from "./types/gameState";
export * from "./types/hero";
export * from "./types/result";
export * from "./types/skill";
export * from "./types/wave";
export * from "./utils/random";

import { initialBalance } from "./data/balance";
import type { GameState } from "./types/gameState";

export function createInitialGameState(seed = "mvp-placeholder-seed"): GameState {
  return {
    mode: "single_random_wave_defense",
    seed,
    board: Array.from({ length: initialBalance.boardRows * initialBalance.boardColumns }, () => null),
    boardSize: {
      rows: initialBalance.boardRows,
      columns: initialBalance.boardColumns,
    },
    resources: initialBalance.startingResources,
    lives: initialBalance.startingLives,
    currentWave: 1,
    score: 0,
    summonCount: 0,
    status: "ready",
  };
}
