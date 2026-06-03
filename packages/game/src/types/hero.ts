import type { AssetKey } from "@discord-random-defense/types";

export type HeroRole = "tank" | "damage" | "support";
export type HeroGrade = "common" | "rare" | "epic" | "legendary";
export type AttackType = "single" | "area" | "support" | "control";

export type HeroDefinition = {
  id: string;
  displayName: string;
  role: HeroRole;
  grade: HeroGrade;
  attackType: AttackType;
  assetKey: AssetKey;
  power: number;
  attackSpeed: number;
  range: number;
  skillIds: string[];
  tags: string[];
};

export type BoardHero = {
  instanceId: string;
  heroId: string;
  grade: HeroGrade;
  position: BoardPosition;
};

export type BoardPosition = {
  row: number;
  column: number;
};
