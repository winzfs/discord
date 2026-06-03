import { getSummonCost, summonGradeRates } from "../data/balance";
import { heroes } from "../data/heroes";
import type { GameState } from "../types/gameState";
import type { BoardHero, HeroDefinition, HeroGrade } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type SummonResult = {
  state: GameState;
  summonedHero: BoardHero | null;
  reason?: "board_full" | "not_enough_resources" | "no_hero_for_grade";
};

export function pickSummonGrade(random: SeededRandom): HeroGrade {
  const totalWeight = summonGradeRates.reduce((sum, rate) => sum + rate.weight, 0);
  let roll = random() * totalWeight;

  for (const rate of summonGradeRates) {
    roll -= rate.weight;
    if (roll <= 0) return rate.grade;
  }

  return summonGradeRates[summonGradeRates.length - 1]?.grade ?? "normal";
}

export function pickHeroByGrade(grade: HeroGrade, random: SeededRandom): HeroDefinition | null {
  const candidates = heroes.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0] ?? null;
}

export function summonHero(state: GameState, random: SeededRandom): SummonResult {
  const emptyIndex = state.board.findIndex((slot) => slot === null);
  if (emptyIndex < 0) {
    return { state, summonedHero: null, reason: "board_full" };
  }

  const summonCost = getSummonCost(state.summonCount);
  if (state.resources < summonCost) {
    return { state, summonedHero: null, reason: "not_enough_resources" };
  }

  const grade = pickSummonGrade(random);
  const hero = pickHeroByGrade(grade, random);
  if (!hero) {
    return { state, summonedHero: null, reason: "no_hero_for_grade" };
  }

  const boardHero: BoardHero = {
    instanceId: `hero-${state.summonCount + 1}`,
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
      resources: state.resources - summonCost,
      summonCount: state.summonCount + 1,
    },
    summonedHero: boardHero,
  };
}
