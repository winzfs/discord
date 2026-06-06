import { getSummonCost, summonGradeRates } from "../data/balance";
import { heroes } from "../data/heroes";
import { placeHeroOnBoard } from "./boardSystem";
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

  return summonGradeRates[summonGradeRates.length - 1]?.grade ?? "common";
}

export function pickHeroByGrade(grade: HeroGrade, random: SeededRandom, heroPool: HeroDefinition[] = heroes): HeroDefinition | null {
  const candidates = heroPool.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0] ?? null;
}

function summonHeroWithPool(state: GameState, random: SeededRandom, heroPool: HeroDefinition[]): SummonResult {
  const summonCost = getSummonCost(state.summonCount);
  if (state.resources < summonCost) {
    return { state, summonedHero: null, reason: "not_enough_resources" };
  }

  const grade = pickSummonGrade(random);
  const hero = pickHeroByGrade(grade, random, heroPool);
  if (!hero) {
    return { state, summonedHero: null, reason: "no_hero_for_grade" };
  }

  const boardHero = {
    instanceId: `hero-${state.summonCount + 1}`,
    heroId: hero.id,
    grade: hero.grade,
  } satisfies Omit<BoardHero, "position">;

  const placement = placeHeroOnBoard(state, boardHero);
  if (!placement.placedHero) {
    return { state, summonedHero: null, reason: "board_full" };
  }

  return {
    state: {
      ...placement.state,
      resources: state.resources - summonCost,
      summonCount: state.summonCount + 1,
    },
    summonedHero: placement.placedHero,
  };
}

export function summonHero(state: GameState, random: SeededRandom): SummonResult {
  return summonHeroWithPool(state, random, heroes);
}

export function summonHeroFromPool(state: GameState, random: SeededRandom, heroPool: HeroDefinition[]): SummonResult {
  return summonHeroWithPool(state, random, heroPool.length > 0 ? heroPool : heroes);
}
