import type { AssetKey } from "@discord-random-defense/types";

export type HeroRole = "tank" | "damage" | "support";
export type HeroGrade = "common" | "rare" | "epic" | "legendary" | "mythic";
export type AttackType = "single" | "area" | "support" | "control";

export type HeroDefinition = {
  id: string;
  displayName: string;
  description: string;
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

export type BoardPosition = {
  row: number;
  column: number;
};

export type BoardHero = {
  instanceId: string;
  heroId: string;
  grade: HeroGrade;
  position: BoardPosition;
};

export type BoardCell = {
  position: BoardPosition;
  heroId: string | null;
  units: BoardHero[];
};
