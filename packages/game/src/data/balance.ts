import type { HeroGrade } from "../types/hero";

export const initialBalance = {
  boardRows: 5,
  boardColumns: 4,
  startingResources: 60,
  startingLuckStones: 3,
  startingLives: 100,
  baseSummonCost: 10,
  summonCostIncrease: 2,
  maxSummonCost: 80,
  mergeRequiredCount: 3,
  maxWave: 30,
  bossWaveInterval: 5,
  powerUpgradeBaseCost: 100,
  powerUpgradeCostIncrease: 60,
  powerUpgradePowerBonus: 0.5,
} as const;

export const summonGradeRates: Array<{ grade: HeroGrade; weight: number }> = [
  { grade: "common", weight: 72 },
  { grade: "rare", weight: 22 },
  { grade: "epic", weight: 5 },
  { grade: "legendary", weight: 1 },
];

export function getSummonCost(summonCount: number): number {
  return Math.min(
    initialBalance.maxSummonCost,
    initialBalance.baseSummonCost + summonCount * initialBalance.summonCostIncrease,
  );
}

export function getPowerUpgradeCost(upgradeLevel: number): number {
  return initialBalance.powerUpgradeBaseCost + upgradeLevel * initialBalance.powerUpgradeCostIncrease;
}

export function getPowerUpgradeMultiplier(upgradeLevel: number): number {
  return 1 + upgradeLevel * initialBalance.powerUpgradePowerBonus;
}
