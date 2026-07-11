import { grantResearchData } from "./heroStrikeMetaProgress";
import type { EvolutionId, HeroStrikeState, UpgradeId } from "./heroStrikeTypes";

type EvolutionDefinition = {
  id: EvolutionId;
  title: string;
  shortLabel: string;
  requirements: Partial<Record<UpgradeId, number>>;
};

export const HERO_STRIKE_EVOLUTIONS: readonly EvolutionDefinition[] = [
  {
    id: "pulse-storm",
    title: "펄스 스톰",
    shortLabel: "STORM",
    requirements: { "rapid-fire": 3, "twin-shot": 2 },
  },
  {
    id: "hunter-swarm",
    title: "헌터 스웜",
    shortLabel: "SWARM",
    requirements: { "homing-missile": 3, "explosive-rounds": 2 },
  },
  {
    id: "arc-overload",
    title: "아크 오버로드",
    shortLabel: "ARC",
    requirements: { "chain-core": 2, "critical-core": 3 },
  },
  {
    id: "aegis-wing",
    title: "이지스 윙",
    shortLabel: "AEGIS",
    requirements: { "drone-wing": 3, shield: 2 },
  },
] as const;

export function hasEvolution(state: HeroStrikeState, id: EvolutionId) {
  return state.evolutions.includes(id);
}

function requirementsMet(state: HeroStrikeState, definition: EvolutionDefinition) {
  return Object.entries(definition.requirements).every(([id, level]) => {
    return (state.upgradeLevels[id as UpgradeId] ?? 0) >= (level ?? 0);
  });
}

export function unlockEligibleEvolutions(state: HeroStrikeState) {
  if (state.stageIndex < 4) return [];
  const unlocked: EvolutionDefinition[] = [];
  for (const definition of HERO_STRIKE_EVOLUTIONS) {
    if (hasEvolution(state, definition.id) || !requirementsMet(state, definition)) continue;
    state.evolutions.push(definition.id);
    unlocked.push(definition);
    grantResearchData(state, 4);
    if (definition.id === "aegis-wing") {
      state.player.shield = Math.min(5, state.player.shield + 1);
    } else if (definition.id === "pulse-storm") {
      state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + 18);
    }
  }

  const latest = unlocked[unlocked.length - 1];
  if (latest) {
    state.evolutionLabel = latest.title;
    state.evolutionBanner = 2.4;
    state.flash = Math.max(state.flash, 0.35);
    state.shake = Math.max(state.shake, 0.45);
  }
  return unlocked;
}

export function getEvolutionShortLabels(state: HeroStrikeState) {
  return HERO_STRIKE_EVOLUTIONS
    .filter((definition) => state.evolutions.includes(definition.id))
    .map((definition) => definition.shortLabel);
}
