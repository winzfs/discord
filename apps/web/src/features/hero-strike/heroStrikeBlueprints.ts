import type {
  HeroStrikeDifficulty,
  PrimaryWeaponId,
  SupportLoadoutId,
  TacticalLoadoutId,
} from "./heroStrikeTypes";

export type HeroStrikeBlueprintCategory = "primary" | "support" | "tactical" | "difficulty";

type BlueprintEntry = {
  category: HeroStrikeBlueprintCategory;
  id: string;
  title: string;
  rank: number;
};

const BLUEPRINTS: readonly BlueprintEntry[] = [
  { category: "primary", id: "pulse-blasters", title: "펄스 블래스터", rank: 1 },
  { category: "support", id: "homing-missile", title: "유도 미사일", rank: 1 },
  { category: "tactical", id: "shield-matrix", title: "시간 방벽", rank: 1 },
  { category: "difficulty", id: "recruit", title: "신병 위험도", rank: 1 },
  { category: "difficulty", id: "agent", title: "요원 위험도", rank: 1 },
  { category: "primary", id: "scatter-array", title: "산탄 어레이", rank: 2 },
  { category: "support", id: "drone-wing", title: "드론 편대", rank: 2 },
  { category: "tactical", id: "salvage-magnet", title: "회수 자석", rank: 3 },
  { category: "support", id: "side-cannons", title: "측면 포대", rank: 3 },
  { category: "primary", id: "rail-driver", title: "레일 드라이버", rank: 4 },
  { category: "tactical", id: "pulse-battery", title: "펄스 배터리", rank: 4 },
  { category: "difficulty", id: "legend", title: "전설 위험도", rank: 5 },
] as const;

export function getHeroStrikeBlueprintRank(
  category: HeroStrikeBlueprintCategory,
  id: string,
) {
  return BLUEPRINTS.find((entry) => entry.category === category && entry.id === id)?.rank ?? 1;
}

export function isHeroStrikeBlueprintUnlocked(
  researchRank: number,
  category: HeroStrikeBlueprintCategory,
  id: string,
) {
  return researchRank >= getHeroStrikeBlueprintRank(category, id);
}

export function getNextHeroStrikeBlueprint(researchRank: number) {
  return BLUEPRINTS
    .filter((entry) => entry.rank > researchRank)
    .sort((left, right) => left.rank - right.rank)[0] ?? null;
}

export function getUnlockedHeroStrikeBlueprintCount(researchRank: number) {
  return BLUEPRINTS.filter((entry) => entry.rank <= researchRank).length;
}

export function getHeroStrikeBlueprintCount() {
  return BLUEPRINTS.length;
}

export function normalizeHeroStrikeBlueprintLoadout(loadout: {
  primary: PrimaryWeaponId;
  support: SupportLoadoutId;
  tactical: TacticalLoadoutId;
  difficulty: HeroStrikeDifficulty;
}, researchRank: number) {
  return {
    primary: isHeroStrikeBlueprintUnlocked(researchRank, "primary", loadout.primary)
      ? loadout.primary
      : "pulse-blasters" as PrimaryWeaponId,
    support: isHeroStrikeBlueprintUnlocked(researchRank, "support", loadout.support)
      ? loadout.support
      : "homing-missile" as SupportLoadoutId,
    tactical: isHeroStrikeBlueprintUnlocked(researchRank, "tactical", loadout.tactical)
      ? loadout.tactical
      : "shield-matrix" as TacticalLoadoutId,
    difficulty: isHeroStrikeBlueprintUnlocked(researchRank, "difficulty", loadout.difficulty)
      ? loadout.difficulty
      : "agent" as HeroStrikeDifficulty,
  };
}
