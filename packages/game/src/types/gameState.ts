import type { BoardCell } from "./hero";
import type { RunBoostState } from "./runBoost";

export type GameMode = "single_random_wave_defense";
export type GameStatus = "ready" | "playing" | "cleared" | "failed";

export type GameState = {
  mode: GameMode;
  seed: string;
  board: BoardCell[];
  boardSize: {
    rows: number;
    columns: number;
  };
  resources: number;
  luckStones: number;
  lives: number;
  currentWave: number;
  score: number;
  summonCount: number;
  powerUpgradeLevel: number;
  runBoosts: RunBoostState;
  defeatedEnemies: number;
  defeatedBosses: number;
  clearedWaves: number;
  status: GameStatus;
};
