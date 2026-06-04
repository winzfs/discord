import type { RunBoostDefinition, RunBoostId, RunBoostState } from "../types/runBoost";

export const initialRunBoosts: RunBoostState = {
  attack: 0,
  economy: 0,
  summon: 0,
  luck: 0,
};

export const runBoosts: RunBoostDefinition[] = [
  {
    id: "attack",
    displayName: "Attack Boost",
    description: "Increase total damage for this run.",
    baseCost: 80,
    costIncrease: 55,
    effectPerLevel: 0.12,
    maxLevel: 20,
  },
  {
    id: "economy",
    displayName: "Economy Boost",
    description: "Increase coin rewards for this run.",
    baseCost: 70,
    costIncrease: 50,
    effectPerLevel: 0.1,
    maxLevel: 20,
  },
  {
    id: "summon",
    displayName: "Summon Boost",
    description: "Reduce summon cost for this run.",
    baseCost: 65,
    costIncrease: 45,
    effectPerLevel: 0.04,
    maxLevel: 15,
  },
  {
    id: "luck",
    displayName: "Luck Boost",
    description: "Improve perfect wave bonus for this run.",
    baseCost: 75,
    costIncrease: 50,
    effectPerLevel: 0.08,
    maxLevel: 15,
  },
];

export function getRunBoostById(id: RunBoostId): RunBoostDefinition | null {
  return runBoosts.find((boost) => boost.id === id) ?? null;
}

export function getRunBoostCost(id: RunBoostId, level: number): number {
  const boost = getRunBoostById(id);
  if (!boost) return 0;
  return boost.baseCost + level * boost.costIncrease;
}

export function getRunBoostEffect(id: RunBoostId, level: number): number {
  const boost = getRunBoostById(id);
  if (!boost) return 0;
  return level * boost.effectPerLevel;
}
