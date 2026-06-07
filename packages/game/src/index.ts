export * from "./data/artifacts";
export * from "./data/balance";
export * from "./data/enemies";
export * from "./data/gamble";
export * from "./data/gameModes";
export * from "./data/heroes";
export * from "./data/heroTactics";
export * from "./data/mythicRecipes";
export * from "./data/pets";
export * from "./data/runBoosts";
export * from "./data/runMissions";
export * from "./data/skills";
export * from "./data/waves";
export * from "./rules/scoring";
export * from "./systems/attackUpgradeSystem";
export * from "./systems/boardSystem";
export * from "./systems/combatSystem";
export * from "./systems/gambleSystem";
export * from "./systems/mergeSystem";
export * from "./systems/mythicCraftSystem";
export * from "./systems/runChoiceSystem";
export * from "./systems/sellSystem";
export * from "./systems/stackMergeSystem";
export * from "./systems/summonSystem";
export * from "./systems/waveSystem";
export * from "./types/enemy";
export * from "./types/gameState";
export * from "./types/hero";
export * from "./types/heroTactics";
export * from "./types/result";
export * from "./types/runBoost";
export * from "./types/skill";
export * from "./types/wave";
export * from "./utils/random";

import { initialBalance } from "./data/balance";
import { initialRunBoosts } from "./data/runBoosts";
import { createInitialBoard } from "./systems/boardSystem";
import type { GameState } from "./types/gameState";

export function createInitialGameState(seed = "mvp-placeholder-seed"): GameState {
  return {
    mode: "single_random_wave_defense",
    seed,
    board: createInitialBoard(initialBalance.boardRows, initialBalance.boardColumns),
    boardSize: {
      rows: initialBalance.boardRows,
      columns: initialBalance.boardColumns,
    },
    resources: initialBalance.startingResources,
    luckStones: initialBalance.startingLuckStones,
    lives: initialBalance.startingLives,
    currentWave: 1,
    score: 0,
    summonCount: 0,
    powerUpgradeLevel: 0,
    runBoosts: initialRunBoosts,
    defeatedEnemies: 0,
    defeatedBosses: 0,
    clearedWaves: 0,
    status: "ready",
  };
}
