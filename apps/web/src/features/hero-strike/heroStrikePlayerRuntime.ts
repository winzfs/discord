import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT } from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { createUpgradeChoices } from "./heroStrikeUpgrades";
import { awardEnemyDefeat } from "./heroStrikeWeaponRuntime";
import type { HeroStrikeState, PickupKind } from "./heroStrikeTypes";

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function clearNearbyEnemyBullets(state: HeroStrikeState, radius: number) {
  const { x, y } = state.player;
  const radiusSq = radius * radius;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy || distanceSquared(bullet.x, bullet.y, x, y) > radiusSq);
}

export function resolvePlayerCollisions(state: HeroStrikeState) {
  const player = state.player;
  if (player.invulnerable > 0) return;
  let hit = false;

  for (const bullet of state.bullets) {
    if (!bullet.enemy || bullet.life <= 0) continue;
    const hitRadius = player.radius + bullet.radius * 0.68;
    const distanceSq = distanceSquared(player.x, player.y, bullet.x, bullet.y);
    if (distanceSq <= hitRadius * hitRadius) {
      bullet.life = 0;
      hit = true;
      break;
    }
    const grazeRadius = hitRadius + 21;
    if (!bullet.grazed && distanceSq <= grazeRadius * grazeRadius) {
      bullet.grazed = true;
      player.ultimate = Math.min(player.ultimateMax, player.ultimate + 1.5);
      state.score += 20;
      addFloatingText(state, player.x + 22, player.y - 12, "GRAZE", HERO_STRIKE_COLORS.cyan, 11);
    }
  }

  if (!hit) {
    for (const enemy of state.enemies) {
      const radius = player.radius + enemy.radius * 0.72;
      if (distanceSquared(player.x, player.y, enemy.x, enemy.y) <= radius * radius) {
        hit = true;
        enemy.hp -= player.damage * 2;
        break;
      }
    }
  }
  if (!hit) return;

  if (player.shield > 0) {
    player.shield -= 1;
    addFloatingText(state, player.x, player.y - 34, "SHIELD", HERO_STRIKE_COLORS.shield, 16);
  } else player.hp -= 1;
  player.invulnerable = 1.25;
  player.combo = 0;
  player.comboTimer = 0;
  state.flash = 0.42;
  state.shake = 0.8;
  clearNearbyEnemyBullets(state, 85);
  addBurst(state, player.x, player.y, HERO_STRIKE_COLORS.red, 22, 210, 4);
  addRing(state, player.x, player.y, HERO_STRIKE_COLORS.red, 28);
  if (player.hp <= 0) state.phase = "game-over";
}

function detonateBombPickup(state: HeroStrikeState) {
  const player = state.player;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  addRing(state, player.x, player.y - 110, HERO_STRIKE_COLORS.orange, 42);
  addBurst(state, player.x, player.y - 110, HERO_STRIKE_COLORS.orange, 28, 260, 4);
  addFloatingText(state, player.x, player.y - 46, "SCREEN CLEAR", HERO_STRIKE_COLORS.orange, 16);
  state.shake = Math.max(state.shake, 0.65);

  const targets = [...state.enemies];
  for (const enemy of targets) {
    enemy.hp -= enemy.boss ? 240 + player.damage * 2 : 320 + player.damage * 3;
    if (enemy.hp <= 0 && !enemy.dead) {
      enemy.dead = true;
      awardEnemyDefeat(state, enemy);
      if (state.phase !== "playing") break;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
}

function grantExperience(state: HeroStrikeState, value: number) {
  const player = state.player;
  player.xp += value;
  if (player.xp < player.nextXp || state.phase !== "playing") return;
  player.xp -= player.nextXp;
  player.level += 1;
  player.nextXp = Math.round(player.nextXp * 1.3 + 8);
  state.phase = "level-up";
  state.upgradeChoices = createUpgradeChoices(state);
  state.flash = 0.24;
}

function grantPickup(state: HeroStrikeState, kind: PickupKind, value: number) {
  const player = state.player;
  if (kind === "heal") {
    player.hp = Math.min(player.maxHp, player.hp + value);
    addFloatingText(state, player.x, player.y - 30, "+HP", HERO_STRIKE_COLORS.green, 16);
  } else if (kind === "charge") {
    player.ultimate = Math.min(player.ultimateMax, player.ultimate + value);
    addFloatingText(state, player.x, player.y - 30, `ULT +${value}`, HERO_STRIKE_COLORS.gold, 15);
  } else if (kind === "shield") {
    player.shield = Math.min(5, player.shield + value);
    addFloatingText(state, player.x, player.y - 30, "SHIELD +1", HERO_STRIKE_COLORS.shield, 15);
  } else if (kind === "bomb") {
    detonateBombPickup(state);
  } else if (kind === "overdrive") {
    player.overdrive = Math.min(18, player.overdrive + value);
    addFloatingText(state, player.x, player.y - 30, "OVERDRIVE", HERO_STRIKE_COLORS.purple, 16);
  } else if (kind === "missile") {
    player.homingMissileTime = Math.min(30, player.homingMissileTime + value);
    player.missileCooldown = 0;
    addFloatingText(state, player.x, player.y - 30, "HOMING MISSILE", HERO_STRIKE_COLORS.orange, 15);
  } else if (kind === "support-drone") {
    player.supportDroneTime = Math.min(36, player.supportDroneTime + value);
    player.supportDroneCooldown = 0;
    addFloatingText(state, player.x, player.y - 30, "SUPPORT DRONE", HERO_STRIKE_COLORS.lime, 15);
  } else if (kind === "time-warp") {
    player.timeWarp = Math.min(16, player.timeWarp + value);
    addFloatingText(state, player.x, player.y - 30, "TIME WARP", HERO_STRIKE_COLORS.cyan, 15);
  } else if (kind === "xp-core") {
    addFloatingText(state, player.x, player.y - 30, `XP +${value}`, HERO_STRIKE_COLORS.xp, 15);
    grantExperience(state, value);
  } else {
    grantExperience(state, value);
  }
}

function pickupColor(kind: PickupKind) {
  if (kind === "heal") return HERO_STRIKE_COLORS.green;
  if (kind === "charge") return HERO_STRIKE_COLORS.gold;
  if (kind === "shield") return HERO_STRIKE_COLORS.shield;
  if (kind === "bomb" || kind === "missile") return HERO_STRIKE_COLORS.orange;
  if (kind === "support-drone") return HERO_STRIKE_COLORS.lime;
  if (kind === "time-warp" || kind === "xp-core") return HERO_STRIKE_COLORS.xp;
  if (kind === "overdrive") return HERO_STRIKE_COLORS.purple;
  return HERO_STRIKE_COLORS.xp;
}

export function updatePickups(state: HeroStrikeState, dt: number) {
  const player = state.player;
  for (const pickup of state.pickups) {
    pickup.life -= dt;
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (distance <= player.magnetRadius) {
      const speed = 150 + (player.magnetRadius - Math.min(player.magnetRadius, distance)) * 4;
      pickup.vx += dx / distance * speed * dt;
      pickup.vy += dy / distance * speed * dt;
    } else pickup.vy += pickup.kind === "xp" ? 42 * dt : 24 * dt;
    pickup.vx *= Math.pow(0.92, dt * 60);
    pickup.vy *= Math.pow(0.96, dt * 60);
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;

    const collectRadius = 18 + pickup.radius + 8;
    if (distanceSquared(player.x, player.y, pickup.x, pickup.y) <= collectRadius * collectRadius) {
      pickup.life = 0;
      grantPickup(state, pickup.kind, pickup.value);
      addBurst(state, pickup.x, pickup.y, pickupColor(pickup.kind), pickup.kind === "xp" ? 4 : 8, 90, 2);
    }
  }
  state.pickups = state.pickups.filter((pickup) => pickup.life > 0 && pickup.y < HERO_STRIKE_HEIGHT + 40);
}

export function activateUltimate(state: HeroStrikeState) {
  const player = state.player;
  if (state.phase !== "playing" || player.ultimate < player.ultimateMax) return false;
  player.ultimate = 0;
  state.flash = 0.75;
  state.shake = 1;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  addRing(state, player.x, player.y - 120, HERO_STRIKE_COLORS.gold, 38);
  addBurst(state, player.x, player.y - 120, HERO_STRIKE_COLORS.gold, 44, 320, 5);

  const targets = [...state.enemies];
  for (const enemy of targets) {
    enemy.hp -= enemy.boss ? 680 + player.damage * 5 : 99999;
    if (enemy.hp <= 0 && !enemy.dead) {
      enemy.dead = true;
      awardEnemyDefeat(state, enemy);
      if (state.phase !== "playing") break;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  return true;
}