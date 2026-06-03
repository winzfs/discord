import type { HeroGrade } from "../types/hero";

export const initialBalance = {
  boardRows: 4,
  boardColumns: 4,
  startingResources: 100,
  startingLives: 20,
  baseSummonCost: 10,
  summonCostIncrease: 2,
  maxSummonCost: 100,
  mergeRequiredCount: 3,
  maxWave: 30,
  bossWaveInterval: 5,
} as const;

export const summonGradeRates: Array<{ grade: HeroGrade; weight: number }> = [
  { grade: "normal", weight: 65 },
  { grade: "rare", weight: 25 },
  { grade: "epic", weight: 8 },
  { grade: "legendary", weight: 2 },
];

export function getSummonCost(summonCount: number): number {
  return Math.min(
    initialBalance.maxSummonCost,
    initialBalance.baseSummonCost + summonCount * initialBalance.summonCostIncrease,
  );
}
