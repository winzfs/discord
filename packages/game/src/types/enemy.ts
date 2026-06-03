import type { AssetKey } from "@discord-random-defense/types";

export type EnemyType = "basic" | "elite" | "boss";

export type EnemyDefinition = {
  id: string;
  displayName: string;
  type: EnemyType;
  assetKey: AssetKey;
  health: number;
  reward: number;
  tags: string[];
};
