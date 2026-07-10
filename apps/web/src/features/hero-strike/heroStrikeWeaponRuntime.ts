import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addBurst, addFloatingText } from "./heroStrikeEffects";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function spawnPlayerBullet(state: HeroStrikeState, angle: number, xOffset: number) {
  const player = state.player;
  state.bullets.push({
    id: state.nextId++, x: player.x + xOffset, y: player.y - 28,
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
    id: state.nextId++, x: enemy.x, y: enemy.y + enemy.radius * 0.4,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    radius, damage: 1, pierce: 0, enemy: true, life: 5,
    color: enemy.boss ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.purple,
  });
}

export function updateEnemyFire(state: HeroStrikeState, enemy: HeroStrikeEnemy, dt: number) {
  if (enemy.kind === "runner" || enemy.y < 30) return;
  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown > 0) return;
  const baseAngle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);

  if (enemy.boss) {
    if (Math.floor(enemy.age / 3) % 2 === 0) {
      for (let index = -3; index <= 3; index += 1) spawnEnemyBullet(state, enemy, baseAngle + index * 0.15, 165, 6);
    } else {
      for (let index = 0; index < 12; index += 1) spawnEnemyBullet(state, enemy, enemy.age * 0.7 + index * Math.PI / 6, 125, 5.5);
    }
    enemy.fireCooldown = 0.85;
  } else if (enemy.kind === "tank") {
    for (let index = -1; index <= 1; index += 1) spawnEnemyBullet(state, enemy, baseAngle + index * 0.22, 135, 6);
    enemy.fireCooldown = 1.55;
  } else {
    spawnEnemyBullet(state, enemy, baseAngle, 155);
    enemy.fireCooldown = 1.35 + Math.random() * 0.55;
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
  addBurst(state, enemy.x, enemy.y, enemy.boss ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.orange, enemy.boss ? 40 : 14, enemy.boss ? 260 : 150, enemy.boss ? 5 : 3);
  addFloatingText(state, enemy.x, enemy.y - enemy.radius, `+${Math.round(enemy.score * multiplier)}`, HERO_STRIKE_COLORS.gold, enemy.boss ? 24 : 14);

  const pickupCount = enemy.boss ? 12 : enemy.kind === "tank" ? 3 : 1;
  for (let index = 0; index < pickupCount; index += 1) {
    state.pickups.push({
      id: state.nextId++, kind: "xp", x: enemy.x, y: enemy.y,
      vx: (Math.random() - 0.5) * 95, vy: -40 - Math.random() * 75,
      value: Math.max(2, Math.round(enemy.reward / pickupCount)), radius: 5.5, life: 8,
    });
  }
  if (!enemy.boss && Math.random() < 0.035 && state.player.hp < state.player.maxHp) {
    state.pickups.push({ id: state.nextId++, kind: "heal", x: enemy.x, y: enemy.y, vx: 0, vy: -55, value: 1, radius: 8, life: 8 });
  }
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
      addBurst(state, bullet.x, bullet.y, bullet.color, 4, 70, 1.6);
      if (bullet.pierce > 0) bullet.pierce -= 1; else bullet.life = 0;
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
  state.bullets = state.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -40 && bullet.x < HERO_STRIKE_WIDTH + 40 && bullet.y > -60 && bullet.y < HERO_STRIKE_HEIGHT + 60);
}
