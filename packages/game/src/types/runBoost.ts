export type RunBoostId = "attack" | "economy" | "summon" | "luck";

export type RunBoostState = Record<RunBoostId, number>;

export type RunBoostDefinition = {
  id: RunBoostId;
  displayName: string;
  description: string;
  baseCost: number;
  costIncrease: number;
  effectPerLevel: number;
  maxLevel: number;
};
