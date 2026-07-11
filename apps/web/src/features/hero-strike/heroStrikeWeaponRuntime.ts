import { playHeroStrikeSound } from "./heroStrikeAudio";
import { getEliteResearchReward } from "./heroStrikeBalance";
import { applyBossBreakPressure, getBossBreakDamageMultiplier } from "./heroStrikeBossBreak";
import { applyEnemyHitFeedback, playEnemyDefeatFeedback } from "./heroStrikeCombatFeedback";
import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_MAX_BULLETS,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { hasEvolution } from "./heroStrikeEvolutions";
import {
  addHeroStrikeFlow,
  getHeroStrikeFlowDamageMultiplier,
  getHeroStrikeFlowFireRateMultiplier,
  isHeroStrikeFlowRush,
} from "./heroStrikeFlow";
import { grantResearchData } from "./heroStrikeMetaProgress";
import { recordStageEnemyDefeat } from "./heroStrikeObjectives";
import { maybeSpawnBonusPickup, spawnEnemyXp, spawnHeroStrikePickup } from "./heroStrikePickups";
import { completeHeroStrikeStage } from "./heroStrikeStageRuntime";
import {
  getChainDamageScale,
  getChainRange,
  getExplosionDamageScale,
  getExplosionRadius,
  getRearGuardAngles,
  getRearGuardDamageScale,
  getSideCannonAngles,
  getSideCannonDamageScale,
} from "./heroStrikeUpgradeScaling";
import type {
  HeroStrikeBullet,
  HeroStrikeEnemy,
  HeroStrikeState,
  PlayerBulletStyle,
  PrimaryWeaponId,
} from "./heroStrikeTypes";

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
  style?: PlayerBulletStyle;
  radius?: number;
  speedScale?: number;
  life?: number;
  color?: string;
  breakPower?: number;
  impactForce?: number;
};

function criticalStats(state: HeroStrikeState) {
  return {
    chance: Math.min(0.75, state.player.criticalChance + state.player.bonusCriticalChance),
    multiplier: state.player.criticalMultiplier + state.player.bonusCriticalMultiplier,
  };
}

function primaryBulletColor(primary: PrimaryWeaponId, critical: boolean, rush: boolean) {
  if (critical || rush) return HERO_STRIKE_COLORS.gold;
  if (primary === "scatter-array") return HERO_STRIKE_COLORS.orange;
  if (primary === "rail-driver") return HERO_STRIKE_COLORS.white;
  return HERO_STRIKE_COLORS.cyan;
}

function spawnPlayerBullet(state: HeroStrikeState, angle: number, options: PlayerBulletOptions = {}) {
  const player = state.player;
  const critical = criticalStats(state);
  const isCritical = Math.random() < critical.chance;
  const damageScale = options.damageScale ?? 1;
  const criticalScale = isCritical ? critical.multiplier : 1;
  const explosionScale = options.explosionScale ?? 1;
  const baseChain = options.chain ?? player.chainCoreLevel;
  const evolutionChain = hasEvolution(state, "arc-overload") && baseChain > 0 ? 2 : 0;
  const rush = isHeroStrikeFlowRush(state);
  const style = options.style ?? state.loadout.primary;
  const speed = player.bulletSpeed * (options.speedScale ?? 1);

  state.bullets.push({
    id: state.nextId++,
    x: player.x + (options.xOffset ?? 0),
    y: player.y - 28 + (options.yOffset ?? 0),
    vx: Math.sin(angle) * speed,
    vy: -Math.cos(angle) * speed,
    radius: options.radius ?? 4.2,
    damage: player.damage
      * player.campaignDamageMultiplier
      * damageScale
      * criticalScale
      * getHeroStrikeFlowDamageMultiplier(state),
    pierce: options.pierce ?? player.pierce,
    enemy: false,
    life: options.life ?? 1.5,
    color: options.color ?? primaryBulletColor(state.loadout.primary, isCritical, rush),
    explosionRadius: player.explosiveRoundsLevel > 0
      ? getExplosionRadius(player.explosiveRoundsLevel) * explosionScale
      : undefined,
    chain: baseChain + evolutionChain,
    style,
    originY: player.y,
    breakPower: options.breakPower ?? 1,
    impactForce: options.impactForce ?? 18,
    critical: isCritical,
  });
}

function firePulseWeapons(state: HeroStrikeState) {
  const player = state.player;
  const centered = (player.bulletCount - 1) / 2;
  const burstInterval = isHeroStrikeFlowRush(state) ? 3 : 6;
  const burst = player.shotCounter % burstInterval === 0;
  for (let index = 0; index < player.bulletCount; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, position * player.spread, {
      xOffset: position * 7,
      damageScale: burst ? 1.18 : 1,
      style: "pulse-blasters",
      impactForce: burst ? 24 : 17,
    });
  }
  if (burst) {
    spawnPlayerBullet(state, -0.23, { xOffset: -13, damageScale: 0.7, style: "pulse-blasters" });
    spawnPlayerBullet(state, 0.23, { xOffset: 13, damageScale: 0.7, style: "pulse-blasters" });
  }
  playHeroStrikeSound("pulse-shot", burst ? 1.2 : 0.8);
}

function fireScatterWeapons(state: HeroStrikeState) {
  const player = state.player;
  const centered = (player.bulletCount - 1) / 2;
  const spread = Math.max(0.16, player.spread * 1.35);
  for (let index = 0; index < player.bulletCount; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, position * spread, {
      xOffset: position * 8,
      style: "scatter-array",
      radius: 4.8,
      life: 0.88,
      speedScale: 0.92,
      impactForce: 27,
      breakPower: 1.12,
    });
  }
  playHeroStrikeSound("scatter-shot", 1);
}

function fireRailWeapons(state: HeroStrikeState) {
  const player = state.player;
  const centered = (player.bulletCount - 1) / 2;
  for (let index = 0; index < player.bulletCount; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, position * Math.min(0.055, player.spread * 0.35), {
      xOffset: position * 8,
      damageScale: 1.08,
      pierce: player.pierce + 2,
      style: "rail-driver",
      radius: 6.4,
      speedScale: 1.18,
      life: 1.35,
      color: HERO_STRIKE_COLORS.white,
      breakPower: 2.35,
      impactForce: 42,
      explosionScale: 0.55,
    });
  }
  state.shake = Math.max(state.shake, 0.13);
  playHeroStrikeSound("rail-shot", 1.05);
}

function fireForwardWeapons(state: HeroStrikeState) {
  state.player.shotCounter += 1;
  if (state.loadout.primary === "scatter-array") fireScatterWeapons(state);
  else if (state.loadout.primary === "rail-driver") fireRailWeapons(state);
  else firePulseWeapons(state);

  if (hasEvolution(state, "pulse-storm")) {
    spawnPlayerBullet(state, -0.42, {
      xOffset: -18,
      damageScale: 0.72,
      pierce: state.player.pierce + 1,
      style: "support",
    });
    spawnPlayerBullet(state, 0.42, {
      xOffset: 18,
      damageScale: 0.72,
      pierce: state.player.pierce + 1,
      style: "support",
    });
  }

  if (isHeroStrikeFlowRush(state) && state.player.shotCounter % 2 === 0) {
    spawnPlayerBullet(state, -0.3, { xOffset: -16, damageScale: 0.5, style: "support" });
    spawnPlayerBullet(state, 0.3, { xOffset: 16, damageScale: 0.5, style: "support" });
  }
}

function fireSideCannons(state: HeroStrikeState) {
  const level = state.player.sideCannonLevel;
  if (level <= 0) return;
  const damageScale = getSideCannonDamageScale(level);
  for (const angle of getSideCannonAngles(level)) {
    spawnPlayerBullet(state, angle, {
      xOffset: Math.sign(angle) * 15,
      damageScale,
      pierce: state.player.pierce + (level >= 3 ? 1 : 0),
      explosionScale: 0.72,
      chain: state.player.chainCoreLevel,
      style: "support",
      radius: 3.5,
      impactForce: 13,
    });
  }
}

function fireRearGuard(state: HeroStrikeState) {
  const level = state.player.rearGuardLevel;
  if (level <= 0) return;
  const damageScale = getRearGuardDamageScale(level);
  for (const angle of getRearGuardAngles(level)) {
    spawnPlayerBullet(state, angle, {
      xOffset: (angle - Math.PI) * 28,
      yOffset: 48,
      damageScale,
      pierce: level >= 3 ? 1 : 0,
      explosionScale: 0.65,
      chain: state.player.chainCoreLevel,
      style: "support",
      radius: 3.5,
      impactForce: 12,
    });
  }
}

export function updatePlayerFire(state: HeroStrikeState, dt: number) {
  const player = state.player;
  player.fireCooldown -= dt;
  if (player.fireCooldown > 0) return;
  fireForwardWeapons(state);
  fireSideCannons(state);
  fireRearGuard(state);
  const evolutionRate = hasEvolution(state, "pulse-storm") ? 0.9 : 1;
  player.fireCooldown = player.fireInterval
    * player.campaignFireRateMultiplier
    * getHeroStrikeFlowFireRateMultiplier(state)
    * evolutionRate;
}

function awardEliteDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  if (!enemy.elite) return;
  const research = grantResearchData(state, getEliteResearchReward(state.stageIndex));
  spawnHeroStrikePickup(state, "xp-core", enemy.x, enemy.y, 32 + state.stageIndex * 3);
  addFloatingText(state, enemy.x, enemy.y + enemy.radius + 22, `ELITE · DATA +${research}`, HERO_STRIKE_COLORS.purple, 15);
  state.shake = Math.max(state.shake, 0.55);
}

export function awardEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  state.kills += 1;
  state.player.combo += 1;
  state.player.comboTimer = 2.25;
  recordStageEnemyDefeat(state, enemy);
  const comboMultiplier = 1 + Math.min(4, Math.floor(state.player.combo / 10)) * 0.25;
  const awardedScore = Math.round(enemy.score * comboMultiplier * state.player.scoreMultiplier);
  state.score += awardedScore;
  const baseUltimateGain = enemy.boss ? 35 : enemy.elite ? 12 : 5;
  const ultimateGain = baseUltimateGain * state.player.ultimateGainMultiplier;
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + ultimateGain);
  addHeroStrikeFlow(state, enemy.boss ? 30 : enemy.elite ? 18 : 7);
  playEnemyDefeatFeedback(enemy);
  addBurst(
    state,
    enemy.x,
    enemy.y,
    enemy.boss ? HERO_STRIKE_COLORS.gold : enemy.elite ? HERO_STRIKE_COLORS.purple : HERO_STRIKE_COLORS.orange,
    enemy.boss ? 36 : enemy.elite ? 22 : 12,
    enemy.boss ? 280 : enemy.elite ? 210 : 165,
    enemy.boss ? 6 : enemy.elite ? 5 : 3.5,
  );
  addFloatingText(
    state,
    enemy.x,
    enemy.y - enemy.radius,
    `+${awardedScore}`,
    HERO_STRIKE_COLORS.gold,
    enemy.boss ? 24 : enemy.elite ? 18 : 14,
  );

  spawnEnemyXp(state, enemy);
  awardEliteDefeat(state, enemy);
  maybeSpawnBonusPickup(state, enemy);
  if (enemy.boss) completeHeroStrikeStage(state);
}

function scatterDistanceMultiplier(bullet: HeroStrikeBullet, enemy: HeroStrikeEnemy) {
  if (bullet.style !== "scatter-array" || bullet.originY === undefined) return 1;
  const distance = Math.abs(bullet.originY - enemy.y);
  const closeness = Math.max(0, Math.min(1, 1 - distance / 430));
  return 0.65 + closeness * 0.9;
}

function damageEnemy(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  damage: number,
  bullet?: HeroStrikeBullet,
) {
  if (enemy.dead || state.phase !== "playing") return;
  const styleScale = bullet ? scatterDistanceMultiplier(bullet, enemy) : 1;
  const actualDamage = damage * styleScale * getBossBreakDamageMultiplier(enemy);
  const previousHp = enemy.hp;
  state.damageDealt += Math.min(previousHp, Math.max(0, actualDamage));
  enemy.hp -= actualDamage;
  if (bullet) {
    applyBossBreakPressure(state, enemy, actualDamage, bullet.breakPower ?? 1);
    applyEnemyHitFeedback(state, enemy, bullet, actualDamage, enemy.hp <= 0);
  }
  if (enemy.hp <= 0) {
    enemy.dead = true;
    awardEnemyDefeat(state, enemy);
  }
}

function applyExplosion(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const radius = bullet.explosionRadius ?? 0;
  const level = state.player.explosiveRoundsLevel;
  if (radius <= 0 || level <= 0 || state.phase !== "playing") return;
  const radiusSquared = radius * radius;
  addRing(state, source.x, source.y, HERO_STRIKE_COLORS.orange, Math.min(26, radius * 0.45));
  for (const enemy of [...state.enemies]) {
    if (enemy.id === source.id || enemy.dead) continue;
    if (distanceSquared(source.x, source.y, enemy.x, enemy.y) > radiusSquared) continue;
    damageEnemy(state, enemy, bullet.damage * getExplosionDamageScale(level));
    if (state.phase !== "playing") return;
  }
}

function applyChain(state: HeroStrikeState, source: HeroStrikeEnemy, bullet: HeroStrikeBullet) {
  const chainCount = bullet.chain ?? 0;
  if (chainCount <= 0 || state.phase !== "playing") return;
  const arcOverload = hasEvolution(state, "arc-overload");
  const range = getChainRange(chainCount) * (arcOverload ? 1.18 : 1);
  const candidates = state.enemies
    .filter((enemy) => !enemy.dead && enemy.id !== source.id)
    .map((enemy) => ({ enemy, distance: distanceSquared(source.x, source.y, enemy.x, enemy.y) }))
    .filter((entry) => entry.distance <= range * range)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, chainCount);

  for (let index = 0; index < candidates.length; index += 1) {
    const target = candidates[index].enemy;
    addBurst(state, target.x, target.y, HERO_STRIKE_COLORS.lime, arcOverload ? 5 : 3, 72, 1.8);
    const evolutionScale = arcOverload ? 1.28 : 1;
    damageEnemy(state, target, bullet.damage * getChainDamageScale(chainCount, index) * evolutionScale);
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

      damageEnemy(state, enemy, bullet.damage, bullet);
      addBurst(
        state,
        bullet.x,
        bullet.y,
        bullet.color,
        bullet.style === "rail-driver" ? 7 : bullet.style === "scatter-array" ? 4 : 2,
        bullet.style === "rail-driver" ? 110 : 70,
        bullet.style === "rail-driver" ? 2.8 : 1.6,
      );
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
  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
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
