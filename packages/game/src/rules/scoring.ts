import type { GameResult } from "../types/result";

export function calculateScore(result: Pick<GameResult, "reachedWave" | "defeatedEnemies" | "survived">): number {
  const survivalBonus = result.survived ? 1_000 : 0;
  return result.reachedWave * 100 + result.defeatedEnemies * 10 + survivalBonus;
}
