import type { AssetKey } from "@discord-random-defense/types";
import type { SkillEffectType } from "./skill";

export type EnemyType = "basic" | "fast" | "tank" | "elite" | "boss";

export type EnemyTacticalRole = "swarm" | "runner" | "armored" | "elite" | "boss";

export type EnemyDefinition = {
  id: string;
  displayName: string;
  type: EnemyType;
  tacticalRole: EnemyTacticalRole;
  counterEffects: SkillEffectType[];
  assetKey: AssetKey;
  health: number;
  speed: number;
  reward: number;
  damageToLife: number;
  tags: string[];
};
