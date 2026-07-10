import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_MISSILES,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addRing } from "./heroStrikeEffects";
import { awardEnemyDefeat } from "./heroStrikeWeaponRuntime";
import type { HeroStrikeEnemy, HeroStrikeMissile, HeroStrikeState } from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function nearestEnemy(state: HeroStrikeState, x: number, y: number) {
  let nearest: HeroStrikeEnemy | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const distance = distanceSquared(x, y, enemy.x, enemy.y);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function criticalDamage(state: HeroStrikeState, damage: number) {
  return Math.random() < state.player.criticalChance
    ? damage * state.player.criticalMultiplier
    : damage;
}

function spawnMissile(state: HeroStrikeState) {
  const target = nearestEnemy(state, state.player.x, state.player.y);
  if (!target) return;
  const level = state.player.homingMissileLevel;
  const side = state.nextId % 2 === 0 ? -1 : 1;
  state.missiles.push({
    id: state.nextId++,
    x: state.player.x + side * 18,
    y: state.player.y - 12,
    vx: side * 80,
    vy: -280,
    speed: 340 + level * 18,
    turnRate: 5.8 + level * 0.55,
    damage: criticalDamage(state, 62 + state.player.damage * (1.35 + level * 0.35)),
    radius: 7,
    explosionRadius: 42 + level * 9,
    life: 4.5,
    targetId: target.id,
  });
  if (state.missiles.length > HERO_STRIKE_MAX_MISSILES) {
    state.missiles.splice(0, state.missiles.length - HERO_STRIKE_MAX_MISSILES);
  }
}

function spawnDroneVolley(state: HeroStrikeState) {
  const player = state.player;
  const level = Math.max(1, player.supportDroneLevel);
  const timedBoost = player.supportDroneTime > 0 ? 0.18 : 0;
  for (const side of [-1, 1] as const) {
    const critical = Math.random() < player.criticalChance;
    state.bullets.push({
      id: state.nextId++,
      x: player.x + side * 30,
      y: player.y - 8,
      vx: side * (18 + level * 4),
      vy: -830,
      radius: 3.4,
      damage: player.damage * (0.34 + level * 0.11 + timedBoost) * (critical ? player.criticalMultiplier : 1),
      pierce: level >= 4 ? 1 : 0,
      enemy: false,
      life: 1.35,
      color: critical ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.lime,
      explosionRadius: player.explosiveRoundsLevel > 0 ? 12 + player.explosiveRoundsLevel * 4 : undefined,
      chain: player.chainCoreLevel > 0 ? 1 : undefined,
    });
  }
}

function normalizeAngle(angle: number) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function updateMissileHeading(state: HeroStrikeState, missile: HeroStrikeMissile, dt: number) {
  let target = state.enemies.find((enemy) => enemy.id === missile.targetId && !enemy.dead) ?? null;
  if (!target) {
    target = nearestEnemy(state, missile.x, missile.y);
    missile.targetId = target?.id ?? null;
  }
  if (!target) return;

  const currentAngle = Math.atan2(missile.vy, missile.vx);
  const desiredAngle = Math.atan2(target.y - missile.y, target.x - missile.x);
  const difference = normalizeAngle(desiredAngle - currentAngle);
  const turn = Math.max(-missile.turnRate * dt, Math.min(missile.turnRate * dt, difference));
  const nextAngle = currentAngle + turn;
  missile.vx = Math.cos(nextAngle) * missile.speed;
  missile.vy = Math.sin(nextAngle) * missile.speed;
}

function explodeMissile(state: HeroStrikeState, missile: HeroStrikeMissile) {
  addRing(state, missile.x, missile.y, HERO_STRIKE_COLORS.orange, 18);
  addBurst(state, missile.x, missile.y, HERO_STRIKE_COLORS.orange, 12, 175, 3);
  const radiusSquared = missile.explosionRadius * missile.explosionRadius;
  const targets = [...state.enemies];
  for (const enemy of targets) {
    if (enemy.dead || distanceSquared(missile.x, missile.y, enemy.x, enemy.y) > radiusSquared) continue;
    enemy.hp -= missile.damage * (enemy.boss ? 0.72 : 1);
    if (enemy.hp <= 0) {
      enemy.dead = true;
      awardEnemyDefeat(state, enemy);
      if (state.phase !== "playing") break;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  missile.life = 0;
}

function updateMissiles(state: HeroStrikeState, dt: number) {
  for (const missile of state.missiles) {
    updateMissileHeading(state, missile, dt);
    missile.x += missile.vx * dt;
    missile.y += missile.vy * dt;
    missile.life -= dt;

    const directTarget = state.enemies.find(
      (enemy) => !enemy.dead
        && distanceSquared(missile.x, missile.y, enemy.x, enemy.y) <= (missile.radius + enemy.radius) ** 2,
    );
    if (directTarget) explodeMissile(state, missile);
    if (state.phase !== "playing") break;
  }

  state.missiles = state.missiles.filter(
    (missile) => missile.life > 0
      && missile.x > -60
      && missile.x < HERO_STRIKE_WIDTH + 60
      && missile.y > -80
      && missile.y < HERO_STRIKE_HEIGHT + 60,
  );
}

export function updateSupportWeapons(state: HeroStrikeState, dt: number) {
  const player = state.player;
  player.supportDroneTime = Math.max(0, player.supportDroneTime - dt);
  player.timeWarp = Math.max(0, player.timeWarp - dt);

  if (player.homingMissileLevel > 0) {
    player.missileCooldown -= dt;
    if (player.missileCooldown <= 0 && state.enemies.length > 0) {
      spawnMissile(state);
      player.missileCooldown = Math.max(0.42, 1.42 - player.homingMissileLevel * 0.18);
    }
  } else player.missileCooldown = 0;

  if (player.supportDroneLevel > 0 || player.supportDroneTime > 0) {
    player.supportDroneCooldown -= dt;
    if (player.supportDroneCooldown <= 0) {
      spawnDroneVolley(state);
      const level = Math.max(1, player.supportDroneLevel);
      player.supportDroneCooldown = Math.max(0.2, 0.56 - level * 0.07 - (player.supportDroneTime > 0 ? 0.08 : 0));
    }
  } else player.supportDroneCooldown = 0;

  updateMissiles(state, dt);
}