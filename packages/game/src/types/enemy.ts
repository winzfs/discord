import type { AssetKey } from "@discord-random-defense/types";

export type EnemyType = "basic" | "fast" | "tank" | "elite" | "boss";

export type EnemyDefinition = {
  id: string;
  displayName: string;
  type: EnemyType;
  assetKey: AssetKey;
  health: number;
  speed: number;
  reward: number;
  damageToLife: number;
  tags: string[];
};
