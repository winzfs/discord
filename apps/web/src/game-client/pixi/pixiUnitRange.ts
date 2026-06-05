import { getHeroById } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";

function getRoleRange(role: HeroRole | undefined) {
  if (role === "tank") return 115;
  if (role === "support") return 130;
  return 150;
}

function getGradeRangeBonus(hero: BoardHero) {
  if (hero.grade === "mythic") return 18;
  if (hero.grade === "legendary") return 10;
  return 0;
}

export function getPixiUnitAttackRange(hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";

  return getRoleRange(role) + getGradeRangeBonus(hero);
}

export function isPointInPixiUnitRange(from: { x: number; y: number }, target: { x: number; y: number }, range: number) {
  return Math.hypot(target.x - from.x, target.y - from.y) <= range;
}
