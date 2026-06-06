import { getHeroById, skills } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";

const ADJACENT_BUFF_PER_SUPPORT = 0.045;
const TEAM_WIDE_BUFF_PER_SUPPORT = 0.025;
const COMMANDER_BUFF = 0.055;
const MAX_SYNERGY_MULTIPLIER = 1.35;

function getSkillTags(skillId: string) {
  return skills.find((skill) => skill.id === skillId)?.tags ?? [];
}

function getHeroTags(heroId: string) {
  const definition = getHeroById(heroId);
  const skillTags = definition?.skillIds.flatMap(getSkillTags) ?? [];
  return new Set([...(definition?.tags ?? []), ...skillTags]);
}

export function isAdjacentToHero(source: BoardHero, target: BoardHero) {
  const rowDistance = Math.abs(source.position.row - target.position.row);
  const columnDistance = Math.abs(source.position.column - target.position.column);

  return rowDistance <= 1 && columnDistance <= 1 && rowDistance + columnDistance > 0;
}

function getAllBoardHeroes(refs: GameRefs) {
  return refs.state.board.flatMap((cell) => cell.units);
}

export function isBuffSupportHero(hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  if (definition?.role !== "support") return false;

  const tags = getHeroTags(hero.heroId);
  return tags.has("buff") || tags.has("haste") || tags.has("power-up") || tags.has("attack-speed") || tags.has("team-wide");
}

function isCommander(hero: BoardHero) {
  const tags = getHeroTags(hero.heroId);
  return tags.has("commander") || tags.has("team-wide");
}

export function getHeroSynergyAttackMultiplier(refs: GameRefs, hero: BoardHero) {
  const heroes = getAllBoardHeroes(refs).filter((unit) => unit.instanceId !== hero.instanceId);
  let bonus = 0;

  for (const ally of heroes) {
    if (!isBuffSupportHero(ally)) continue;

    if (isAdjacentToHero(hero, ally)) {
      bonus += ADJACENT_BUFF_PER_SUPPORT;
    }

    if (isCommander(ally)) {
      bonus += ally.grade === "legendary" ? COMMANDER_BUFF : TEAM_WIDE_BUFF_PER_SUPPORT;
    }
  }

  return Math.min(MAX_SYNERGY_MULTIPLIER, 1 + bonus);
}

export function getHeroSynergyLabel(refs: GameRefs, hero: BoardHero) {
  const multiplier = getHeroSynergyAttackMultiplier(refs, hero);
  if (multiplier <= 1.001) return null;

  return `연계 +${Math.round((multiplier - 1) * 100)}%`;
}
