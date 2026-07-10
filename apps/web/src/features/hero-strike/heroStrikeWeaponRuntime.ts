import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addFloatingText } from "./heroStrikeEffects";
import { maybeSpawnBonusPickup, spawnEnemyXp } from "./heroStrikePickups";
import { completeHeroStrikeStage } from "./heroStrikeStageRuntime";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function spawnPlayerBullet(state: HeroStrikeState, angle: number, xOffset: number) {
  const player = state.player;
  state.bullets.push({
    id: state.nextId++,
    x: player.x + xOffset,
    y: player.y - 28,
    vx: Math.sin(angle) * player.bulletSpeed,
    vy: -Math.cos(angle) * player.bulletSpeed,
    radius: 4.2,
    damage: player.damage * (player.overdrive > 0 ? 1.25 + player.overdriveLevel * 0.12 : 1),
    pierce: player.pierce,
    enemy: false,
    life: 1.5,
    color: player.overdrive > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan,
  });
}

export function updatePlayerFire(state: HeroStrikeState, dt: number) {
  const player = state.player;
  player.fireCooldown -= dt;
  if (player.fireCooldown > 0) return;
  const centered = (player.bulletCount - 1) / 2;
  for (let index = 0; index < player.bulletCount; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, position * player.spread, position * 7);
  }
  player.fireCooldown = player.fireInterval * (player.overdrive > 0 ? 0.62 : 1);
}

export function awardEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  state.kills += 1;
  state.player.combo += 1;
  state.player.comboTimer = 2.25;
  if (state.player.combo >= 25) state.player.overdrive = Math.max(state.player.overdrive, 4.5);
  const multiplier = 1 + Math.min(4, Math.floor(state.player.combo / 10)) * 0.25;
  state.score += Math.round(enemy.score * multiplier);
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + (enemy.boss ? 35 : 5));
  addBurst(
    state,
    enemy.x,
    enemy.y,
    enemy.boss ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.orange,
    enemy.boss ? 30 : 9,
    enemy.boss ? 240 : 145,
    enemy.boss ? 5 : 3,
  );
  addFloatingText(
    state,
    enemy.x,
    enemy.y - enemy.radius,
    `+${Math.round(enemy.score * multiplier)}`,
    HERO_STRIKE_COLORS.gold,
    enemy.boss ? 24 : 14,
  );

  spawnEnemyXp(state, enemy);
  maybeSpawnBonusPickup(state, enemy);

  if (enemy.boss) completeHeroStrikeStage(state);
}

export function resolveBulletCollisions(state: HeroStrikeState) {
  for (const bullet of state.bullets) {
    if (bullet.enemy || bullet.life <= 0) continue;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const hitRadius = bullet.radius + enemy.radius;
      if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) > hitRadius * hitRadius) continue;
      enemy.hp -= bullet.damage;
      addBurst(state, bullet.x, bullet.y, bullet.color, 2, 65, 1.5);
      if (bullet.pierce > 0) bullet.pierce -= 1;
      else bullet.life = 0;
      if (enemy.hp <= 0) {
        enemy.dead = true;
        awardEnemyDefeat(state, enemy);
      }
      if (bullet.life <= 0 || state.phase !== "playing") break;
    }
    if (state.phase !== "playing") break;
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
}

export function updateBullets(state: HeroStrikeState, dt: number) {
  const enemyTimeScale = state.player.timeWarp > 0 ? 0.48 : 1;
  for (const bullet of state.bullets) {
    const movementScale = bullet.enemy ? enemyTimeScale : 1;
    bullet.x += bullet.vx * dt * movementScale;
    bullet.y += bullet.vy * dt * movementScale;
    bullet.life -= dt;
  }

  const activeBullets = state.bullets.filter(
    (bullet) => bullet.life > 0
      && bullet.x > -40
      && bullet.x < HERO_STRIKE_WIDTH + 40
      && bullet.y > -60
      && bullet.y < HERO_STRIKE_HEIGHT + 60,
  );
  state.bullets = activeBullets.length > HERO_STRIKE_MAX_BULLETS
    ? activeBullets.slice(activeBullets.length - HERO_STRIKE_MAX_BULLETS)
    : activeBullets;
}