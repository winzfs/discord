import { getEnemyBulletCap } from "./heroStrikeBalance";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type {
  EnemyBulletVariant,
  HeroStrikeEnemy,
  HeroStrikeState,
} from "./heroStrikeTypes";

export type HeroStrikeEnemyBulletOptions = {
  radius?: number;
  variant?: EnemyBulletVariant;
  xOffset?: number;
  yOffset?: number;
  originX?: number;
  originY?: number;
  life?: number;
  damage?: number;
};

export function countHeroStrikeHostileBullets(state: HeroStrikeState) {
  let count = 0;
  for (const bullet of state.bullets) {
    if (bullet.enemy && bullet.life > 0) count += 1;
  }
  return count;
}

export function spawnHeroStrikeEnemyBullet(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  angle: number,
  speed: number,
  options: HeroStrikeEnemyBulletOptions = {},
) {
  if (countHeroStrikeHostileBullets(state) >= getEnemyBulletCap(state)) return false;

  const x = options.originX
    ?? enemy.x + (options.xOffset ?? 0);
  const y = options.originY
    ?? enemy.y + enemy.radius * 0.4 + (options.yOffset ?? 0);

  state.bullets.push({
    id: state.nextId++,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: options.radius ?? 5.2,
    damage: options.damage ?? 1,
    pierce: 0,
    enemy: true,
    life: options.life ?? 6,
    color: enemy.boss ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.hostile,
    variant: options.variant ?? "orb",
  });
  return true;
}
