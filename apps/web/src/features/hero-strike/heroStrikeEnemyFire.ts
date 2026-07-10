import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { getCurrentHeroStrikeStage } from "./heroStrikeStages";
import type { EnemyBulletVariant, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

type BulletOptions = {
  radius?: number;
  variant?: EnemyBulletVariant;
  xOffset?: number;
  yOffset?: number;
};

function spawnEnemyBullet(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  angle: number,
  speed: number,
  options: BulletOptions = {},
) {
  state.bullets.push({
    id: state.nextId++,
    x: enemy.x + (options.xOffset ?? 0),
    y: enemy.y + enemy.radius * 0.4 + (options.yOffset ?? 0),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: options.radius ?? 5.2,
    damage: 1,
    pierce: 0,
    enemy: true,
    life: 6,
    color: enemy.boss ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.hostile,
    variant: options.variant ?? "orb",
  });
}

function aimedAngle(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  return Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
}

function fireStagePattern(state: HeroStrikeState, enemy: HeroStrikeEnemy, speed: number) {
  const stage = getCurrentHeroStrikeStage(state);
  const base = aimedAngle(state, enemy);

  if (enemy.kind === "sniper") {
    spawnEnemyBullet(state, enemy, base, speed * 1.55, { radius: 4.4, variant: "needle" });
    enemy.fireCooldown = Math.max(1.15, 1.8 - state.stageIndex * 0.08);
    return;
  }

  if (enemy.kind === "bomber") {
    const count = stage.bulletPattern === "assault" || stage.bulletPattern === "fan" ? 7 : 5;
    for (let index = 0; index < count; index += 1) {
      const offset = index - (count - 1) / 2;
      spawnEnemyBullet(state, enemy, Math.PI / 2 + offset * 0.18, speed * 0.72, { radius: 7, variant: "heavy" });
    }
    enemy.fireCooldown = Math.max(1.15, 1.75 - state.stageIndex * 0.06);
    return;
  }

  if (enemy.kind === "weaver") {
    const sway = Math.sin(enemy.age * 2.4) * 0.18;
    spawnEnemyBullet(state, enemy, base - 0.16 + sway, speed * 1.04, { radius: 4.8, variant: "shard" });
    spawnEnemyBullet(state, enemy, base + 0.16 - sway, speed * 1.04, { radius: 4.8, variant: "shard" });
    enemy.fireCooldown = Math.max(0.92, 1.32 - state.stageIndex * 0.05);
    return;
  }

  if (stage.bulletPattern === "aimed") {
    spawnEnemyBullet(state, enemy, base, speed);
  } else if (stage.bulletPattern === "split") {
    spawnEnemyBullet(state, enemy, base - 0.11, speed);
    spawnEnemyBullet(state, enemy, base + 0.11, speed);
  } else if (stage.bulletPattern === "cross") {
    spawnEnemyBullet(state, enemy, base, speed);
    spawnEnemyBullet(state, enemy, base - 0.22, speed * 0.92, { variant: "shard" });
    spawnEnemyBullet(state, enemy, base + 0.22, speed * 0.92, { variant: "shard" });
    spawnEnemyBullet(state, enemy, Math.PI / 2, speed * 0.78, { radius: 6, variant: "heavy" });
  } else if (stage.bulletPattern === "rain") {
    const count = enemy.kind === "tank" ? 5 : 3;
    for (let index = 0; index < count; index += 1) {
      const offset = index - (count - 1) / 2;
      spawnEnemyBullet(state, enemy, Math.PI / 2 + offset * 0.055, speed * 0.92, {
        xOffset: offset * 9,
        variant: "needle",
      });
    }
  } else if (stage.bulletPattern === "fan") {
    const count = enemy.kind === "tank" ? 7 : 5;
    for (let index = 0; index < count; index += 1) {
      const offset = index - (count - 1) / 2;
      spawnEnemyBullet(state, enemy, base + offset * 0.14, speed * (0.88 + Math.abs(offset) * 0.025));
    }
  } else {
    const count = enemy.kind === "tank" ? 5 : 3;
    for (let index = 0; index < count; index += 1) {
      const offset = index - (count - 1) / 2;
      spawnEnemyBullet(state, enemy, base + offset * 0.13, speed * 1.06, {
        radius: enemy.kind === "tank" ? 6 : 5.2,
      });
    }
  }

  const baseCooldown = enemy.kind === "tank" ? 1.48 : 1.3;
  enemy.fireCooldown = Math.max(0.78, baseCooldown - state.stageIndex * 0.055 + Math.random() * 0.32);
}

function fireBossFan(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const base = aimedAngle(state, boss);
  for (let index = -3; index <= 3; index += 1) {
    spawnEnemyBullet(state, boss, base + index * 0.14, speed, { radius: 6 });
  }
  boss.fireCooldown = 0.82;
}

function fireBossPetals(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const count = 12;
  const rotation = Math.floor(boss.age * 1.7) % 2 === 0 ? 0 : Math.PI / count;
  for (let index = 0; index < count; index += 1) {
    spawnEnemyBullet(state, boss, rotation + index * Math.PI * 2 / count, speed * 0.82, { variant: "shard" });
  }
  boss.fireCooldown = 0.76;
}

function fireBossSpiral(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const arms = 4;
  for (let index = 0; index < arms; index += 1) {
    spawnEnemyBullet(state, boss, boss.age * 1.35 + index * Math.PI * 2 / arms, speed * 0.86, { radius: 5.5 });
    spawnEnemyBullet(state, boss, -boss.age * 1.05 + index * Math.PI * 2 / arms + 0.3, speed * 0.7, { variant: "shard" });
  }
  boss.fireCooldown = 0.34;
}

function fireBossLanes(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  for (let index = -4; index <= 4; index += 1) {
    if ((index + Math.floor(boss.age * 2)) % 4 === 0) continue;
    spawnEnemyBullet(state, boss, Math.PI / 2, speed * 0.95, {
      xOffset: index * 27,
      radius: 5,
      variant: "needle",
    });
  }
  boss.fireCooldown = 0.72;
}

function fireBossBurst(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const base = aimedAngle(state, boss);
  for (let index = -4; index <= 4; index += 1) {
    spawnEnemyBullet(state, boss, base + index * 0.095, speed * 1.08, {
      radius: index === 0 ? 7 : 5.4,
      variant: index === 0 ? "heavy" : "orb",
    });
  }
  boss.fireCooldown = 0.58;
}

function fireBossHybrid(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const phase = Math.floor(boss.age / 2.5) % 3;
  if (phase === 0) fireBossBurst(state, boss, speed);
  else if (phase === 1) fireBossSpiral(state, boss, speed);
  else fireBossLanes(state, boss, speed);
  boss.fireCooldown = Math.max(0.32, boss.fireCooldown);
}

function fireBossPattern(state: HeroStrikeState, boss: HeroStrikeEnemy, speed: number) {
  const pattern = getCurrentHeroStrikeStage(state).bossPattern;
  if (pattern === "fan") fireBossFan(state, boss, speed);
  else if (pattern === "petals") fireBossPetals(state, boss, speed);
  else if (pattern === "spiral") fireBossSpiral(state, boss, speed);
  else if (pattern === "lanes") fireBossLanes(state, boss, speed);
  else if (pattern === "burst") fireBossBurst(state, boss, speed);
  else fireBossHybrid(state, boss, speed);
}

export function updateEnemyFire(state: HeroStrikeState, enemy: HeroStrikeEnemy, dt: number) {
  if (enemy.kind === "runner" || enemy.y < 28) return;
  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown > 0) return;

  const stage = getCurrentHeroStrikeStage(state);
  const speed = 150 * stage.bulletSpeedMultiplier;
  if (enemy.boss) fireBossPattern(state, enemy, speed * 0.92);
  else fireStagePattern(state, enemy, speed);
}