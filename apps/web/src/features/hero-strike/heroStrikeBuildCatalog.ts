import { HERO_STRIKE_EVOLUTIONS } from "./heroStrikeEvolutions";
import type { HeroStrikeState, UpgradeId } from "./heroStrikeTypes";

export type HeroStrikeUpgradeRole = "weapon" | "systems" | "survival";
export type HeroStrikeBuildTag =
  | "RAPID"
  | "PRECISION"
  | "EXPLOSIVE"
  | "CHAIN"
  | "SUMMON"
  | "DEFENSE"
  | "MOBILITY"
  | "BREAK";

type HeroStrikeBuildMetadata = {
  role: HeroStrikeUpgradeRole;
  tags: readonly HeroStrikeBuildTag[];
};

const BUILD_METADATA: Record<UpgradeId, HeroStrikeBuildMetadata> = {
  "rapid-fire": { role: "weapon", tags: ["RAPID"] },
  "twin-shot": { role: "weapon", tags: ["RAPID"] },
  "power-core": { role: "weapon", tags: ["BREAK"] },
  piercing: { role: "weapon", tags: ["PRECISION", "BREAK"] },
  magnet: { role: "survival", tags: ["MOBILITY"] },
  shield: { role: "survival", tags: ["DEFENSE"] },
  "pulse-drive": { role: "systems", tags: ["MOBILITY"] },
  overclock: { role: "weapon", tags: ["RAPID", "MOBILITY"] },
  "homing-missile": { role: "systems", tags: ["SUMMON", "EXPLOSIVE"] },
  "drone-wing": { role: "systems", tags: ["SUMMON", "DEFENSE"] },
  "side-cannons": { role: "systems", tags: ["RAPID"] },
  "rear-guard": { role: "systems", tags: ["DEFENSE"] },
  "explosive-rounds": { role: "weapon", tags: ["EXPLOSIVE", "BREAK"] },
  "chain-core": { role: "weapon", tags: ["CHAIN"] },
  "critical-core": { role: "weapon", tags: ["PRECISION"] },
};

export function getHeroStrikeUpgradeRole(id: UpgradeId) {
  return BUILD_METADATA[id].role;
}

export function getHeroStrikeBuildTags(id: UpgradeId) {
  return BUILD_METADATA[id].tags;
}

export function getHeroStrikeUpgradeRoleLabel(id: UpgradeId) {
  const role = getHeroStrikeUpgradeRole(id);
  if (role === "weapon") return "주무기";
  if (role === "systems") return "전술 시스템";
  return "생존·기동";
}

export function getHeroStrikeEvolutionHint(state: HeroStrikeState, id: UpgradeId) {
  const evolution = HERO_STRIKE_EVOLUTIONS.find((entry) => (
    !state.evolutions.includes(entry.id)
    && (!entry.primary || entry.primary === state.loadout.primary)
    && Object.prototype.hasOwnProperty.call(entry.requirements, id)
  ));
  if (!evolution) return null;

  const requirements = Object.entries(evolution.requirements);
  const completed = requirements.filter(([requiredId, level]) => (
    (state.upgradeLevels[requiredId as UpgradeId] ?? 0) >= (level ?? 0)
  )).length;
  return {
    title: evolution.title,
    progress: `${completed}/${requirements.length}`,
  };
}

export function getHeroStrikeCurrentTagCounts(state: HeroStrikeState) {
  const counts = new Map<HeroStrikeBuildTag, number>();
  for (const [id, level] of Object.entries(state.upgradeLevels)) {
    if (!level || level <= 0) continue;
    for (const tag of getHeroStrikeBuildTags(id as UpgradeId)) {
      counts.set(tag, (counts.get(tag) ?? 0) + level);
    }
  }
  return counts;
}
