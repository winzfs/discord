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

export function getHeroDamage(state: Pick<GameState, "powerUpgradeLevel">, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase = hero.grade === "mythic" ? 150 : hero.grade === "legendary" ? 95 : hero.grade === "epic" ? 52 : hero.grade === "rare" ? 28 : 16;
  const roleMultiplier = role === "damage" ? 1.18 : role === "tank" ? 0.82 : 0.72;

  return Math.round(gradeBase * roleMultiplier * (1 + state.powerUpgradeLevel * 0.16));
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

export function applyTankSlow<TEnemy extends Pick<PixiCombatEnemy, "speed">>(enemy: TEnemy) {
  enemy.speed = Math.max(0.22, enemy.speed * 0.92);
}

export function findSplashTargets<TEnemy extends PixiCombatEnemy>(activeEnemies: TEnemy[], target: TEnemy, radius = 72) {
  return activeEnemies.filter((enemy) => enemy.alive && enemy.id !== target.id && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius);
}
