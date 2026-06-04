import type { GameState } from "../types/gameState";
import type { BoardHero } from "../types/hero";

export type SellUnitResult = {
  state: GameState;
  soldHero: BoardHero | null;
  reward: number;
  reason?: "invalid_cell" | "empty_cell";
};

const sellRewardByGrade: Record<BoardHero["grade"], number> = {
  common: 8,
  rare: 18,
  epic: 45,
  legendary: 110,
  mythic: 260,
};

export function getSellReward(hero: BoardHero): number {
  return sellRewardByGrade[hero.grade] ?? 0;
}

export function sellTopUnitInCell(state: GameState, cellIndex: number): SellUnitResult {
  const cell = state.board[cellIndex];
  if (!cell) {
    return { state, soldHero: null, reward: 0, reason: "invalid_cell" };
  }

  const soldHero = cell.units[cell.units.length - 1];
  if (!soldHero) {
    return { state, soldHero: null, reward: 0, reason: "empty_cell" };
  }

  const reward = getSellReward(soldHero);
  const nextUnits = cell.units.slice(0, -1);
  const nextBoard = state.board.map((boardCell, index) => {
    if (index !== cellIndex) return boardCell;
    return {
      ...boardCell,
      heroId: nextUnits[0]?.heroId ?? null,
      units: nextUnits,
    };
  });

  return {
    state: {
      ...state,
      board: nextBoard,
      resources: state.resources + reward,
    },
    soldHero,
    reward,
  };
}
