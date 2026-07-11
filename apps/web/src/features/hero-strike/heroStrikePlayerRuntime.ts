import { getNextXpRequirement } from "./heroStrikeBalance";
import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { recordStageGraze, recordStageHit } from "./heroStrikeObjectives";
import { updateHeroStrikePickupMotion } from "./heroStrikePickupPhysics";
import { createUpgradeChoices } from "./heroStrikeUpgrades";
import { awardEnemyDefeat } from "./heroStrikeWeaponRuntime";
import type { HeroStrikeEnemy, HeroStrikeState, PickupKind } from "./heroStrikeTypes";

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

function applyDamage(state: HeroStrikeState, enemy: HeroStrikeEnemy, amount: number) {
  const dealt = Math.min(enemy.hp, Math.max(0, amount));
  enemy.hp -= amount;
  state.damageDealt += dealt;
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
      recordStageGraze(state);
      const gain = 1.5 * player.ultimateGainMultiplier;
      player.ultimate = Math.min(player.ultimateMax, player.ultimate + gain);
      const grazeScore = Math.round(20 * player.scoreMultiplier);
      state.score += grazeScore;
      addFloatingText(state, player.x + 22, player.y - 12, "GRAZE", HERO_STRIKE_COLORS.cyan, 11);
    }
  }

  if (!hit) {
    for (const enemy of state.enemies) {
      const radius = player.radius + enemy.radius * 0.72;
      if (distanceSquared(player.x, player.y, enemy.x, enemy.y) <= radius * radius) {
        hit = true;
        applyDamage(state, enemy, player.damage * player.campaignDamageMultiplier * 2);
        break;
      }
    }
  }
  if (!hit) return;

  recordStageHit(state);
  state.hitsTaken += 1;
  if (player.shield > 0) {
    player.shield -= 1;
    addFloatingText(state, player.x, player.y - 34, "SHIELD", HERO_STRIKE_COLORS.shield, 16);
  } else player.hp -= 1;
  player.invulnerable = 1.25;
  player.combo = 0;
  player.comboTimer = 0;
  state.flash = 0.42;
  state.shake = 0.8;
  clearNearbyEnemyBullets(state, 92);
  addBurst(state, player.x, player.y, HERO_STRIKE_COLORS.red, 22, 210, 4);
  addRing(state, player.x, player.y, HERO_STRIKE_COLORS.red, 28);
  if (player.hp <= 0) state.phase = "game-over";
}

function detonateBombPickup(state: HeroStrikeState) {
  const player = state.player;
  const campaignDamage = player.campaignDamageMultiplier;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  addRing(state, player.x, player.y - 110, HERO_STRIKE_COLORS.orange, 42);
  addBurst(state, player.x, player.y - 110, HERO_STRIKE_COLORS.orange, 28, 260, 4);
  addFloatingText(state, player.x, player.y - 46, "SCREEN CLEAR", HERO_STRIKE_COLORS.orange, 16);
  state.shake = Math.max(state.shake, 0.65);

  const targets = [...state.enemies];
  for (const enemy of targets) {
    const damage = (enemy.boss ? 240 + player.damage * 2 : 320 + player.damage * 3) * campaignDamage;
    applyDamage(state, enemy, damage);
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
  const gained = Math.max(1, Math.round(value * player.xpGainMultiplier));
  player.xp += gained;
  if (player.xp < player.nextXp || state.phase !== "playing") return gained;
  player.xp -= player.nextXp;
  player.level += 1;
  player.nextXp = getNextXpRequirement(player.level);
  const choices = createUpgradeChoices(state);
  state.upgradeChoices = choices;
  state.phase = choices.length > 0 ? "level-up" : "playing";
  if (choices.length === 0) player.xp = 0;
  state.flash = 0.24;
  return gained;
}

function grantPickup(state: HeroStrikeState, kind: PickupKind, value: number) {
  const player = state.player;
  if (kind === "heal") {
    player.hp = Math.min(player.maxHp, player.hp + value);
    addFloatingText(state, player.x, player.y - 30, "+HP", HERO_STRIKE_COLORS.green, 16);
  } else if (kind === "charge") {
    const gain = Math.round(value * player.ultimateGainMultiplier);
    player.ultimate = Math.min(player.ultimateMax, player.ultimate + gain);
    addFloatingText(state, player.x, player.y - 30, `ULT +${gain}`, HERO_STRIKE_COLORS.gold, 15);
  } else if (kind === "shield") {
    player.shield = Math.min(5, player.shield + value);
    addFloatingText(state, player.x, player.y - 30, "SHIELD +1", HERO_STRIKE_COLORS.shield, 15);
  } else if (kind === "bomb") {
    detonateBombPickup(state);
  } else if (kind === "overdrive") {
    player.overdrive = Math.min(18, player.overdrive + value);
    addFloatingText(state, player.x, player.y - 30, "OVERDRIVE", HERO_STRIKE_COLORS.purple, 16);
  } else if (kind === "xp-core") {
    const gained = grantExperience(state, value);
    addFloatingText(state, player.x, player.y - 30, `XP +${gained}`, HERO_STRIKE_COLORS.xp, 15);
  } else {
    grantExperience(state, value);
  }
}

function pickupColor(kind: PickupKind) {
  if (kind === "heal") return HERO_STRIKE_COLORS.green;
  if (kind === "charge") return HERO_STRIKE_COLORS.gold;
  if (kind === "shield") return HERO_STRIKE_COLORS.shield;
  if (kind === "bomb") return HERO_STRIKE_COLORS.orange;
  if (kind === "xp-core") return HERO_STRIKE_COLORS.xp;
  if (kind === "overdrive") return HERO_STRIKE_COLORS.purple;
  return HERO_STRIKE_COLORS.xp;
}

export function updatePickups(state: HeroStrikeState, dt: number) {
  const player = state.player;
  for (const pickup of state.pickups) {
    pickup.life -= dt;
    updateHeroStrikePickupMotion(pickup, player, dt);

    const collectRadius = 18 + pickup.radius + 8;
    if (distanceSquared(player.x, player.y, pickup.x, pickup.y) <= collectRadius * collectRadius) {
      pickup.life = 0;
      grantPickup(state, pickup.kind, pickup.value);
      addBurst(state, pickup.x, pickup.y, pickupColor(pickup.kind), pickup.kind === "xp" ? 4 : 8, 90, 2);
    }
  }
  state.pickups = state.pickups.filter((pickup) => pickup.life > 0 && pickup.y < HERO_STRIKE_HEIGHT + 40);
}

export function activateBlink(state: HeroStrikeState) {
  const player = state.player;
  if (state.phase !== "playing" || player.blinkCharges <= 0) return false;

  let dx = player.targetX - player.x;
  let dy = player.targetY - player.y;
  const length = Math.hypot(dx, dy);
  if (length < 5) {
    dx = 0;
    dy = -1;
  } else {
    dx /= length;
    dy /= length;
  }

  const startX = player.x;
  const startY = player.y;
  player.x = Math.max(25, Math.min(HERO_STRIKE_WIDTH - 25, player.x + dx * 96));
  player.y = Math.max(330, Math.min(HERO_STRIKE_HEIGHT - 62, player.y + dy * 96));
  player.targetX = player.x;
  player.targetY = player.y;
  player.blinkCharges -= 1;
  player.blinkRecharge = Math.max(player.blinkRecharge, player.blinkRechargeDuration);
  player.invulnerable = Math.max(player.invulnerable, 0.55);
  state.blinksUsed += 1;
  clearNearbyEnemyBullets(state, 58);
  addBurst(state, startX, startY, HERO_STRIKE_COLORS.cyan, 12, 155, 3);
  addRing(state, player.x, player.y, HERO_STRIKE_COLORS.cyan, 20);
  state.shake = Math.max(state.shake, 0.18);
  return true;
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
    const damage = (enemy.boss ? 680 + player.damage * 5 : 99999) * player.campaignDamageMultiplier;
    applyDamage(state, enemy, damage);
    if (enemy.hp <= 0 && !enemy.dead) {
      enemy.dead = true;
      awardEnemyDefeat(state, enemy);
      if (state.phase !== "playing") break;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
  return true;
}
