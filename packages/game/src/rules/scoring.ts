import type { GameState } from "../types/gameState";
import type { GameResult } from "../types/result";

export function calculateScore(
  result: Pick<GameResult, "reachedWave" | "clearedWaves" | "defeatedEnemies" | "defeatedBosses" | "remainingLives" | "survived">,
): number {
  const waveScore = result.clearedWaves * 100;
  const enemyScore = result.defeatedEnemies * 5;
  const bossScore = result.defeatedBosses * 500;
  const lifeBonus = Math.max(0, result.remainingLives) * 100;
  const clearBonus = result.survived ? 1_000 : 0;

  return waveScore + enemyScore + bossScore + lifeBonus + clearBonus;
}

export function createGameResultFromState(state: GameState): GameResult {
  const survived = state.status === "cleared";
  const result: GameResult = {
    score: 0,
    reachedWave: state.currentWave,
    clearedWaves: state.clearedWaves,
    defeatedEnemies: state.defeatedEnemies,
    defeatedBosses: state.defeatedBosses,
    remainingLives: state.lives,
    survived,
  };

  return {
    ...result,
    score: calculateScore(result),
  };
}
