import type { AssetKey } from "@discord-random-defense/types";

export type SkillType = "attack" | "control" | "support" | "ultimate";

export type SkillDefinition = {
  id: string;
  displayName: string;
  type: SkillType;
  assetKey: AssetKey;
  tags: string[];
};
