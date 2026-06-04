export type RunUpgradeId = "attack" | "economy" | "summon" | "luck";

export type RunUpgradeState = Record<RunUpgradeId, number>;

export type RunUpgradeDefinition = {
  id: RunUpgradeId;
  displayName: string;
  description: string;
  baseCost: number;
  costIncrease: number;
  effectPerLevel: number;
  maxLevel: number;
};
