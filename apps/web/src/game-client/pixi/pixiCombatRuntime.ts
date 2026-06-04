import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero, GameState, HeroRole } from "@discord-random-defense/game";

export type PixiCombatEnemy = {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  reward: number;
  progress: number;
  speed: number;
  alive: boolean;
  boss: boolean;
};

function hasHeroKeyword(hero: Pick<BoardHero, "heroId">, keywords: string[]) {
  return keywords.some((keyword) => hero.heroId.includes(keyword));
}

export function getHeroDamage(state: Pick<GameState, "powerUpgradeLevel">, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase = hero.grade === "mythic" ? 150 : hero.grade === "legendary" ? 95 : hero.grade === "epic" ? 52 : hero.grade === "rare" ? 28 : 16;
  const roleMultiplier = role === "damage" ? 1.18 : role === "tank" ? 0.82 : 0.72;
  const heroMultiplier = hasHeroKeyword(hero, ["sharpshooter", "railgun", "pulse"]) ? 1.22
    : hasHeroKeyword(hero, ["storm", "mage"]) ? 1.08
      : hasHeroKeyword(hero, ["credit", "treasure"]) ? 0.82
        : hasHeroKeyword(hero, ["overclock", "medic", "mender"]) ? 0.9
          : 1;

  return Math.round(gradeBase * roleMultiplier * heroMultiplier * (1 + state.powerUpgradeLevel * 0.16));
}

export function getBoardFirepower(state: Pick<GameState, "board" | "powerUpgradeLevel">) {
  return getAllBoardHeroes(state.board).reduce((sum, hero) => sum + getHeroDamage(state, hero), 0);
}

export function getRoleAccent(role: HeroRole | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

export function pickAttackTarget<TEnemy extends PixiCombatEnemy>(activeEnemies: TEnemy[], role: HeroRole | undefined): TEnemy | null {
  const liveEnemies = activeEnemies.filter((enemy) => enemy.alive && enemy.progress >= 0);
  if (liveEnemies.length === 0) return null;

  if (role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

export function pickHeroAttackTarget<TEnemy extends PixiCombatEnemy>(activeEnemies: TEnemy[], hero: BoardHero, role: HeroRole | undefined): TEnemy | null {
  const liveEnemies = activeEnemies.filter((enemy) => enemy.alive && enemy.progress >= 0);
  if (liveEnemies.length === 0) return null;

  if (hasHeroKeyword(hero, ["sharpshooter", "railgun", "pulse"]) || hero.grade === "mythic" || role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  if (hasHeroKeyword(hero, ["mage", "storm"])) {
    liveEnemies.sort((a, b) => {
      const crowdA = liveEnemies.filter((enemy) => Math.hypot(enemy.x - a.x, enemy.y - a.y) <= 90).length;
      const crowdB = liveEnemies.filter((enemy) => Math.hypot(enemy.x - b.x, enemy.y - b.y) <= 90).length;
      return crowdB - crowdA || b.progress - a.progress;
    });
    return liveEnemies[0] ?? null;
  }

  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

export function applyTankSlow<TEnemy extends Pick<PixiCombatEnemy, "speed">>(enemy: TEnemy, hero?: Pick<BoardHero, "heroId" | "grade">) {
  const multiplier = hero && hasHeroKeyword(hero, ["shield-anchor", "barrier", "guard", "knight", "bastion"]) ? 0.84 : 0.92;
  const floor = hero?.grade === "mythic" ? 0.16 : 0.22;
  enemy.speed = Math.max(floor, enemy.speed * multiplier);
}

export function getSplashRadius(hero: Pick<BoardHero, "heroId" | "grade">) {
  if (hasHeroKeyword(hero, ["storm", "mage"])) return hero.grade === "mythic" ? 122 : 96;
  if (hasHeroKeyword(hero, ["overclock", "medic", "mender"])) return hero.grade === "mythic" ? 100 : 78;
  return 72;
}

export function getSplashDamageRatio(hero: Pick<BoardHero, "heroId" | "grade">) {
  if (hasHeroKeyword(hero, ["storm", "mage"])) return hero.grade === "mythic" ? 0.55 : 0.42;
  if (hasHeroKeyword(hero, ["overclock", "medic", "mender"])) return hero.grade === "mythic" ? 0.42 : 0.32;
  return 0.35;
}

export function getKillRewardBonus(hero: Pick<BoardHero, "heroId" | "grade">) {
  if (hasHeroKeyword(hero, ["treasure"])) return 8;
  if (hasHeroKeyword(hero, ["credit"])) return 4;
  return 0;
}

export function findSplashTargets<TEnemy extends PixiCombatEnemy>(activeEnemies: TEnemy[], target: TEnemy, radius = 72) {
  return activeEnemies.filter((enemy) => enemy.alive && enemy.id !== target.id && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius);
}
