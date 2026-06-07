import type { AssetKey } from "@discord-random-defense/types";

export type SkillType = "attack" | "control" | "support" | "ultimate";

export type SkillEffectType =
  | "damage"
  | "splash"
  | "chain"
  | "control"
  | "amplify"
  | "tempo"
  | "economy"
  | "execute"
  | "shield"
  | "summon";

export type SkillEffectGroup = "damage-core" | "crowd-control" | "team-scaling" | "resource-scaling" | "finisher";

export type SkillDefinition = {
  id: string;
  displayName: string;
  type: SkillType;
  effectType: SkillEffectType;
  effectGroup: SkillEffectGroup;
  assetKey: AssetKey;
  tags: string[];
  summary: string;
};
