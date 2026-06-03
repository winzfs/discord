import type { BoardHero } from "./hero";

export type GameMode = "single_random_wave_defense";

export type GameState = {
  mode: GameMode;
  seed: string;
  board: Array<BoardHero | null>;
  boardSize: {
    rows: number;
    columns: number;
  };
  resources: number;
  lives: number;
  currentWave: number;
  score: number;
  summonCount: number;
  status: "ready" | "playing" | "finished";
};
