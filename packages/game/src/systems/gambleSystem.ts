import { getGambleTier } from "../data/gamble";
import { pickHeroByGrade } from "./summonSystem";
import type { GameState } from "../types/gameState";
import type { BoardHero } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type GambleResult = {
  state: GameState;
  summonedHero: BoardHero | null;
  success: boolean;
  usedTierId: string;
  reason?: "board_full" | "not_enough_luck_stones" | "unknown_tier" | "no_hero_for_grade";
};

export function gambleSummon(state: GameState, tierId: string, random: SeededRandom): GambleResult {
  const tier = getGambleTier(tierId);
  if (!tier) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "unknown_tier" };
  }

  const emptyIndex = state.board.findIndex((slot) => slot === null);
  if (emptyIndex < 0) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "board_full" };
  }

  if (state.luckStones < tier.costLuckStones) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "not_enough_luck_stones" };
  }

  const success = random() < tier.successRate;
  const grade = success ? tier.targetGrade : tier.fallbackGrade;

  if (!grade) {
    return {
      state: { ...state, luckStones: state.luckStones - tier.costLuckStones },
      summonedHero: null,
      success,
      usedTierId: tierId,
      reason: "no_hero_for_grade",
    };
  }

  const hero = pickHeroByGrade(grade, random);
  if (!hero) {
    return { state, summonedHero: null, success, usedTierId: tierId, reason: "no_hero_for_grade" };
  }

  const boardHero: BoardHero = {
    instanceId: `gamble:${tier.id}:${state.summonCount + 1}`,
    heroId: hero.id,
    grade: hero.grade,
    position: {
      row: Math.floor(emptyIndex / state.boardSize.columns),
      column: emptyIndex % state.boardSize.columns,
    },
  };

  const nextBoard = [...state.board];
  nextBoard[emptyIndex] = boardHero;

  return {
    state: {
      ...state,
      board: nextBoard,
      luckStones: state.luckStones - tier.costLuckStones,
      summonCount: state.summonCount + 1,
    },
    summonedHero: boardHero,
    success,
    usedTierId: tierId,
  };
}
