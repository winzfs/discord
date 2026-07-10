import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addFloatingText } from "./heroStrikeEffects";
import { maybeSpawnBonusPickup, spawnEnemyXp } from "./heroStrikePickups";
import { getCurrentHeroStrikeStage } from "./heroStrikeStages";
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

function spawnEnemyBullet(state: HeroStrikeState, enemy: HeroStrikeEnemy, angle: number, speed: number, radius = 5.2) {
  state.bullets.push({
    id: state.nextId++,
    x: enemy.x,
    y: enemy.y + enemy.radius * 0.4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    damage: 1,
    pierce: 0,
    enemy: true,
    life: 5,
    color: enemy.boss ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.hostile,
  });
}

function fireDronePattern(state: HeroStrikeState, enemy: HeroStrikeEnemy, baseAngle: number, speed: number) {
  const pattern = getCurrentHeroStrikeStage(state).bulletPattern;
  if (pattern === "aimed") {
    spawnEnemyBullet(state, enemy, baseAngle, speed);
    return;
  }
  if (pattern === "split") {
    spawnEnemyBullet(state, enemy, baseAngle - 0.09, speed);
    spawnEnemyBullet(state, enemy, baseAngle + 0.09, speed);
    return;
  }
  for (let index = -1; index <= 1; index += 1) {
    spawnEnemyBullet(state, enemy, baseAngle + index * 0.14, speed, 5.4);
  }
}

function fireTankPattern(state: HeroStrikeState, enemy: HeroStrikeEnemy, baseAngle: number, speed: number) {
  const pattern = getCurrentHeroStrikeStage(state).bulletPattern;
  const spreadCount = pattern === "assault" ? 2 : 1;
  const gap = pattern === "assault" ? 0.16 : 0.22;
  for (let index = -spreadCount; index <= spreadCount; index += 1) {
    spawnEnemyBullet(state, enemy, baseAngle + index * gap, speed, 6);
  }
}

export function updateEnemyFire(state: HeroStrikeState, enemy: HeroStrikeEnemy, dt: number) {
  if (enemy.kind === "runner" || enemy.y < 30) return;
  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown > 0) return;

  const stage = getCurrentHeroStrikeStage(state);
  const baseAngle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  const speedMultiplier = stage.bulletSpeedMultiplier;

  if (enemy.boss) {
    if (Math.floor(enemy.age / 3) % 2 === 0) {
      for (let index = -3; index <= 3; index += 1) {
        spawnEnemyBullet(state, enemy, baseAngle + index * 0.15, 165 * speedMultiplier, 6);
      }
    } else {
      for (let index = 0; index < 12; index += 1) {
        spawnEnemyBullet(state, enemy, enemy.age * 0.7 + index * Math.PI / 6, 125 * speedMultiplier, 5.5);
      }
    }
    enemy.fireCooldown = 0.85;
  } else if (enemy.kind === "tank") {
    fireTankPattern(state, enemy, baseAngle, 135 * speedMultiplier);
    enemy.fireCooldown = stage.bulletPattern === "assault" ? 1.35 : 1.55;
  } else {
    fireDronePattern(state, enemy, baseAngle, 155 * speedMultiplier);
    enemy.fireCooldown = stage.bulletPattern === "assault" ? 1.15 + Math.random() * 0.35 : 1.35 + Math.random() * 0.55;
  }
}

export function awardEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  state.kills += 1;
  state.player.combo += 1;
  state.player.comboTimer = 2.25;
  if (state.player.combo >= 25) state.player.overdrive = Math.max(state.player.overdrive, 4.5);
  const multiplier = 1 + Math.min(4, Math.floor(state.player.combo / 10)) * 0.25;
  state.score += Math.round(enemy.score * multiplier);
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + (enemy.boss ? 35 : 5));
  addBurst(state, enemy.x, enemy.y, enemy.boss ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.orange, enemy.boss ? 30 : 9, enemy.boss ? 240 : 145, enemy.boss ? 5 : 3);
  addFloatingText(state, enemy.x, enemy.y - enemy.radius, `+${Math.round(enemy.score * multiplier)}`, HERO_STRIKE_COLORS.gold, enemy.boss ? 24 : 14);

  spawnEnemyXp(state, enemy);
  maybeSpawnBonusPickup(state, enemy);

  if (enemy.boss) {
    state.bossDefeated = true;
    state.phase = "victory";
    state.flash = 0.65;
    state.shake = 1;
  }
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
      if (bullet.life <= 0) break;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
}

export function updateBullets(state: HeroStrikeState, dt: number) {
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
  }

  const activeBullets = state.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -40 && bullet.x < HERO_STRIKE_WIDTH + 40 && bullet.y > -60 && bullet.y < HERO_STRIKE_HEIGHT + 60);
  state.bullets = activeBullets.length > HERO_STRIKE_MAX_BULLETS
    ? activeBullets.slice(activeBullets.length - HERO_STRIKE_MAX_BULLETS)
    : activeBullets;
}
