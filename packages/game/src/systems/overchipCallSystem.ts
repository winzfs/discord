import { getGambleTier } from "../data/gamble";
import { placeHeroOnBoard } from "./boardSystem";
import { pickHeroByGrade } from "./summonSystem";
import type { GameState } from "../types/gameState";
import type { BoardHero } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type OverchipCallResult = {
  state: GameState;
  summonedHero: BoardHero | null;
  success: boolean;
  usedTierId: string;
  reason?: "board_full" | "not_enough_overchips" | "unknown_tier" | "no_hero_for_grade";
};

export function overchipCall(state: GameState, tierId: string, random: SeededRandom): OverchipCallResult {
  const tier = getGambleTier(tierId);
  if (!tier) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "unknown_tier" };
  }

  if (state.luckStones < tier.costLuckStones) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "not_enough_overchips" };
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

  const boardHero = {
    instanceId: `overchip:${tier.id}:${state.summonCount + 1}`,
    heroId: hero.id,
    grade: hero.grade,
  } satisfies Omit<BoardHero, "position">;

  const placement = placeHeroOnBoard(state, boardHero);
  if (!placement.placedHero) {
    return { state, summonedHero: null, success: false, usedTierId: tierId, reason: "board_full" };
  }

  return {
    state: {
      ...placement.state,
      luckStones: state.luckStones - tier.costLuckStones,
      summonCount: state.summonCount + 1,
    },
    summonedHero: placement.placedHero,
    success,
    usedTierId: tierId,
  };
}
