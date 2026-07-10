import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { maybeSpawnBonusPickup, spawnEnemyXp } from "./heroStrikePickups";
import { completeHeroStrikeStage } from "./heroStrikeStageRuntime";
import type { HeroStrikeBullet, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

type PlayerBulletOptions = {
  damageScale?: number;
  xOffset?: number;
  yOffset?: number;
  pierce?: number;
  explosionScale?: number;
  chain?: number;
};

function spawnPlayerBullet(state: HeroStrikeState, angle: number, options: PlayerBulletOptions = {}) {
  const player = state.player;
  const critical = Math.random() < player.criticalChance;
  const damageScale = options.damageScale ?? 1;
  const overdriveScale = player.overdrive > 0 ? 1.25 + player.overdriveLevel * 0.12 : 1;
  const criticalScale = critical ? player.criticalMultiplier : 1;
  const explosionScale = options.explosionScale ?? 1;

  state.bullets.push({
    id: state.nextId++,
    x: player.x + (options.xOffset ?? 0),
    y: player.y - 28 + (options.yOffset ?? 0),
    vx: Math.sin(angle) * player.bulletSpeed,
    vy: -Math.cos(angle) * player.bulletSpeed,
    radius: 4.2,
    damage: player.damage * damageScale * overdriveScale * criticalScale,
    pierce: options.pierce ?? player.pierce,
    enemy: false,
    life: 1.5,
    color: critical || player.overdrive > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan,
    explosionRadius: player.explosiveRoundsLevel > 0
      ? (24 + player.explosiveRoundsLevel * 7) * explosionScale
      : undefined,
    chain: options.chain ?? player.chainCoreLevel,
  });
}

function fireForwardWeapons(state: HeroStrikeState) {
  const player = state.player;
  const centered = (player.bulletCount - 1) / 2;
  for (let index = 0; index < player.bulletCount; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, position * player.spread, { xOffset: position * 7 });
  }
}

function fireSideCannons(state: HeroStrikeState) {
  const level = state.player.sideCannonLevel;
  if (level <= 0) return;
  const angle = 0.28 + level * 0.045;
  const damageScale = 0.48 + level * 0.1;
  spawnPlayerBullet(state, -angle, { xOffset: -15, damageScale, explosionScale: 0.72, chain: Math.min(1, state.player.chainCoreLevel) });
  spawnPlayerBullet(state, angle, { xOffset: 15, damageScale, explosionScale: 0.72, chain: Math.min(1, state.player.chainCoreLevel) });
}

function fireRearGuard(state: HeroStrikeState) {
  const level = state.player.rearGuardLevel;
  if (level <= 0) return;
  const damageScale = 0.42 + level * 0.08;
  spawnPlayerBullet(state, Math.PI, { yOffset: 48, damageScale, explosionScale: 0.65, chain: 0 });
  if (level >= 2) {
    spawnPlayerBullet(state, Math.PI - 0.24, { xOffset: -8, yOffset: 42, damageScale: damageScale * 0.9, explosionScale: 0.55, chain: 0 });
    spawnPlayerBullet(state, Math.PI + 0.24, { xOffset: 8, yOffset: 42, damageScale: damageScale * 0.9, explosionScale: 0.55, chain: 0 });
  }
}

export function updatePlayerFire(state: HeroStrikeState, dt: number) {
  const player = state.player;
  player.fireCooldown -= dt;
  if (player.fireCooldown > 0) return;
  fireForwardWeapons(state);
  fireSideCannons(state);
  fireRearGuard(state);
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

function damageEnemy(state: HeroStrikeState, enemy: HeroStrikeEnemy, damage: number) {
  if (enemy.dead || state.phase !== "playing") return;
  enemy.hp -= damage;
  if (enemy.hp <= 0) {
    enemy.dead = true;
    awardEnemyDefeat(state, enemy);
  }
}

function applyExplosion(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const radius = bullet.explosionRadius ?? 0;
  if (radius <= 0 || state.phase !== "playing") return;
  const radiusSquared = radius * radius;
  addRing(state, source.x, source.y, HERO_STRIKE_COLORS.orange, Math.min(26, radius * 0.45));
  for (const enemy of [...state.enemies]) {
    if (enemy.id === source.id || enemy.dead) continue;
    if (distanceSquared(source.x, source.y, enemy.x, enemy.y) > radiusSquared) continue;
    damageEnemy(state, enemy, bullet.damage * 0.42);
    if (state.phase !== "playing") return;
  }
}

function applyChain(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const chainCount = bullet.chain ?? 0;
  if (chainCount <= 0 || state.phase !== "playing") return;
  const candidates = state.enemies
    .filter((enemy) => !enemy.dead && enemy.id !== source.id)
    .map((enemy) => ({ enemy, distance: distanceSquared(source.x, source.y, enemy.x, enemy.y) }))
    .filter((entry) => entry.distance <= 160 * 160)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, chainCount);

  for (let index = 0; index < candidates.length; index += 1) {
    const target = candidates[index].enemy;
    const scale = Math.max(0.22, 0.42 - index * 0.07);
    addBurst(state, target.x, target.y, HERO_STRIKE_COLORS.lime, 3, 72, 1.8);
    damageEnemy(state, target, bullet.damage * scale);
    if (state.phase !== "playing") return;
  }
}

export function resolveBulletCollisions(state: HeroStrikeState) {
  for (const bullet of state.bullets) {
    if (bullet.enemy || bullet.life <= 0) continue;
    for (const enemy of state.enemies) {
      if (enemy.dead) continue;
      const hitRadius = bullet.radius + enemy.radius;
      if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) > hitRadius * hitRadius) continue;

      damageEnemy(state, enemy, bullet.damage);
      addBurst(state, bullet.x, bullet.y, bullet.color, 2, 65, 1.5);
      if (state.phase !== "playing") break;
      applyExplosion(state, enemy, bullet);
      applyChain(state, enemy, bullet);

      if (bullet.pierce > 0) bullet.pierce -= 1;
      else bullet.life = 0;
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