import { playHeroStrikeSound } from "./heroStrikeAudio";
import { getEliteResearchReward } from "./heroStrikeBalance";
import { applyBossBreakPressure, getBossBreakDamageMultiplier } from "./heroStrikeBossBreak";
import {
  consumeHeroStrikeRailShot,
  getHeroStrikeAimAngle,
  getHeroStrikePrimaryDamageScale,
  getHeroStrikePrimaryIntervalScale,
  getHeroStrikeSupportDamageScale,
  isHeroStrikeFocus,
} from "./heroStrikeCombatControl";
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
  const evolutionChain = hasEvolution(state, "arc-overload") && baseChain > 0 ? 1 : 0;
  const rush = isHeroStrikeFlowRush(state);
  const style = options.style ?? state.loadout.primary;
  const speed = player.bulletSpeed * (options.speedScale ?? 1);
  const controlScale = style === "support"
    ? getHeroStrikeSupportDamageScale(state)
    : getHeroStrikePrimaryDamageScale(state);

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
      * controlScale
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

function pulseVolleyDamageScale(count: number) {
  if (count <= 1) return 1;
  if (count === 2) return 0.62;
  return 0.48;
}

function scatterVolleyDamageScale(count: number) {
  if (count <= 3) return 1;
  if (count === 4) return 0.82;
  return 0.72;
}

function firePulseWeapons(state: HeroStrikeState) {
  const player = state.player;
  const focus = isHeroStrikeFocus(state);
  const aim = getHeroStrikeAimAngle(state);
  const count = focus ? player.bulletCount : Math.min(2, player.bulletCount);
  const centered = (count - 1) / 2;
  const burstInterval = isHeroStrikeFlowRush(state) ? 2 : 3;
  const burst = focus && player.shotCounter % burstInterval === 0;
  const volleyScale = pulseVolleyDamageScale(count);

  for (let index = 0; index < count; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, aim + position * player.spread * (focus ? 0.72 : 1), {
      xOffset: position * 7,
      damageScale: (focus ? 1.05 : 0.86) * volleyScale * (burst ? 1.16 : 1),
      style: "pulse-blasters",
      impactForce: burst ? 24 : focus ? 18 : 13,
    });
  }

  if (burst) {
    spawnPlayerBullet(state, aim - 0.12, {
      xOffset: -10,
      damageScale: 0.48,
      style: "pulse-blasters",
      impactForce: 20,
    });
    spawnPlayerBullet(state, aim + 0.12, {
      xOffset: 10,
      damageScale: 0.48,
      style: "pulse-blasters",
      impactForce: 20,
    });
  }
  playHeroStrikeSound("pulse-shot", focus ? (burst ? 1.2 : 0.95) : 0.58);
  return true;
}

function fireScatterWeapons(state: HeroStrikeState) {
  const player = state.player;
  const focus = isHeroStrikeFocus(state);
  const aim = getHeroStrikeAimAngle(state);
  const count = focus ? player.bulletCount : Math.min(2, player.bulletCount);
  const centered = (count - 1) / 2;
  const spread = focus ? Math.max(0.1, player.spread * 0.78) : Math.max(0.2, player.spread * 1.55);
  const pelletScale = scatterVolleyDamageScale(count);

  for (let index = 0; index < count; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, aim + position * spread, {
      xOffset: position * 8,
      damageScale: pelletScale * (focus ? 1.18 : 0.74),
      style: "scatter-array",
      radius: focus ? 5.2 : 4.2,
      life: focus ? 0.88 : 0.72,
      speedScale: 0.92,
      impactForce: focus ? 31 : 17,
      breakPower: focus ? 1.18 : 0.62,
    });
  }
  playHeroStrikeSound("scatter-shot", focus ? 1.08 : 0.58);
  return true;
}

function fireRailWeapons(state: HeroStrikeState) {
  const player = state.player;
  const focus = isHeroStrikeFocus(state);
  const aim = getHeroStrikeAimAngle(state);

  if (!focus) {
    spawnPlayerBullet(state, 0, {
      damageScale: 0.34,
      pierce: player.pierce,
      style: "rail-driver",
      radius: 3.4,
      speedScale: 1.12,
      life: 1.2,
      color: HERO_STRIKE_COLORS.cyan,
      breakPower: 0.42,
      impactForce: 13,
      explosionScale: 0.22,
    });
    playHeroStrikeSound("rail-shot", 0.42);
    return true;
  }

  const charge = consumeHeroStrikeRailShot(state);
  if (charge <= 0) return false;
  const count = player.bulletCount;
  const centered = (count - 1) / 2;
  const fullCharge = charge >= 0.92;

  for (let index = 0; index < count; index += 1) {
    const position = index - centered;
    const centerShot = Math.abs(position) < 0.25;
    const chargeScale = 0.72 + charge * 1.48;
    spawnPlayerBullet(state, aim + position * Math.min(0.045, player.spread * 0.28), {
      xOffset: position * 8,
      damageScale: chargeScale * (centerShot ? 1 : 0.34),
      pierce: player.pierce + (centerShot ? 3 : 1),
      style: "rail-driver",
      radius: centerShot ? (fullCharge ? 7.4 : 6.2) : 4.1,
      speedScale: 1.24,
      life: 1.4,
      color: fullCharge ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white,
      breakPower: centerShot ? 1.6 + charge * 1.75 : 0.72,
      impactForce: centerShot ? 34 + charge * 22 : 18,
      explosionScale: 0.42,
    });
  }
  state.shake = Math.max(state.shake, 0.12 + charge * 0.18);
  playHeroStrikeSound("rail-shot", 0.75 + charge * 0.5);
  return true;
}

function fireForwardWeapons(state: HeroStrikeState) {
  state.player.shotCounter += 1;
  let fired = false;
  if (state.loadout.primary === "scatter-array") fired = fireScatterWeapons(state);
  else if (state.loadout.primary === "rail-driver") fired = fireRailWeapons(state);
  else fired = firePulseWeapons(state);
  if (!fired) return false;

  const aim = getHeroStrikeAimAngle(state);
  if (hasEvolution(state, "pulse-storm")) {
    spawnPlayerBullet(state, aim - 0.32, {
      xOffset: -18,
      damageScale: 0.42,
      pierce: state.player.pierce + 1,
      style: "support",
    });
    spawnPlayerBullet(state, aim + 0.32, {
      xOffset: 18,
      damageScale: 0.42,
      pierce: state.player.pierce + 1,
      style: "support",
    });
  }

  if (isHeroStrikeFlowRush(state) && state.player.shotCounter % 3 === 0) {
    spawnPlayerBullet(state, aim - 0.24, { xOffset: -16, damageScale: 0.34, style: "support" });
    spawnPlayerBullet(state, aim + 0.24, { xOffset: 16, damageScale: 0.34, style: "support" });
  }
  return true;
}

function fireSideCannons(state: HeroStrikeState) {
  const level = state.player.sideCannonLevel;
  if (level <= 0) return;
  const damageScale = getSideCannonDamageScale(level);
  for (const angle of getSideCannonAngles(level)) {
    spawnPlayerBullet(state, angle, {
      xOffset: Math.sign(angle) * 15,
      damageScale,
      pierce: state.player.pierce,
      explosionScale: 0.55,
      chain: state.player.chainCoreLevel,
      style: "support",
      radius: 3.2,
      impactForce: 11,
    });
  }
}

function fireRearGuard(state: HeroStrikeState) {
  const level = state.player.rearGuardLevel;
  if (level <= 0) return;
  const damageScale = getRearGuardDamageScale(level);
  for (const angle of getRearGuardAngles(level)) {
    spawnPlayerBullet(state, angle, {
      yOffset: 48,
      damageScale,
      pierce: 0,
      explosionScale: 0.5,
      chain: 0,
      style: "support",
      radius: 3.2,
      impactForce: 10,
    });
  }
}

export function updatePlayerFire(state: HeroStrikeState, dt: number) {
  const player = state.player;
  player.fireCooldown -= dt;
  if (player.fireCooldown > 0) return;

  const fired = fireForwardWeapons(state);
  if (fired) {
    fireSideCannons(state);
    fireRearGuard(state);
  }

  const evolutionRate = hasEvolution(state, "pulse-storm") ? 0.94 : 1;
  const retryRate = state.loadout.primary === "rail-driver" && isHeroStrikeFocus(state) && !fired ? 0.08 : 1;
  player.fireCooldown = retryRate === 0.08
    ? retryRate
    : player.fireInterval
      * player.campaignFireRateMultiplier
      * getHeroStrikeFlowFireRateMultiplier(state)
      * getHeroStrikePrimaryIntervalScale(state)
      * evolutionRate;
}

function awardEliteDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  if (!enemy.elite) return;
  const research = grantResearchData(state, getEliteResearchReward(state.stageIndex));
  spawnHeroStrikePickup(state, "xp-core", enemy.x, enemy.y, 22 + state.stageIndex * 2);
  addFloatingText(state, enemy.x, enemy.y + enemy.radius + 22, `ELITE · DATA +${research}`, HERO_STRIKE_COLORS.purple, 15);
  state.shake = Math.max(state.shake, 0.55);
}

export function awardEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  state.kills += 1;
  state.player.combo += 1;
  state.player.comboTimer = 2.25;
  recordStageEnemyDefeat(state, enemy);
  const comboMultiplier = 1 + Math.min(3, Math.floor(state.player.combo / 12)) * 0.2;
  const awardedScore = Math.round(enemy.score * comboMultiplier * state.player.scoreMultiplier);
  state.score += awardedScore;
  const baseUltimateGain = enemy.boss ? 28 : enemy.elite ? 10 : 4;
  const ultimateGain = baseUltimateGain * state.player.ultimateGainMultiplier;
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + ultimateGain);
  const baseFlow = enemy.boss ? 26 : enemy.elite ? 15 : 5;
  addHeroStrikeFlow(state, baseFlow * (isHeroStrikeFocus(state) ? 1.08 : 0.82));
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
  const closeness = Math.max(0, Math.min(1, 1 - distance / 410));
  return 0.58 + closeness * 0.86;
}

function tankFrontalMultiplier(enemy: HeroStrikeEnemy, bullet?: HeroStrikeBullet) {
  if (enemy.kind !== "tank" || !bullet || bullet.style === "rail-driver") return 1;
  const centerHit = Math.abs(bullet.x - enemy.x) < enemy.radius * 0.48;
  return centerHit ? 0.3 : 1;
}

function bossWeakPointMultiplier(enemy: HeroStrikeEnemy, bullet?: HeroStrikeBullet) {
  if (!enemy.boss || !bullet) return { damage: 1, breakPower: 1, weak: false };
  const weakX = enemy.x + Math.sin(enemy.age * 1.15 + enemy.phase) * enemy.radius * 0.72;
  const weak = Math.abs(bullet.x - weakX) <= Math.max(13, enemy.radius * 0.26);
  return weak
    ? { damage: 1.24, breakPower: 1.65, weak: true }
    : { damage: 1, breakPower: 0.72, weak: false };
}

function damageEnemy(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  damage: number,
  bullet?: HeroStrikeBullet,
) {
  if (enemy.dead || state.phase !== "playing") return;
  const styleScale = bullet ? scatterDistanceMultiplier(bullet, enemy) : 1;
  const tankScale = tankFrontalMultiplier(enemy, bullet);
  const weakPoint = bossWeakPointMultiplier(enemy, bullet);
  const actualDamage = damage
    * styleScale
    * tankScale
    * weakPoint.damage
    * getBossBreakDamageMultiplier(enemy);
  const previousHp = enemy.hp;
  state.damageDealt += Math.min(previousHp, Math.max(0, actualDamage));
  enemy.hp -= actualDamage;
  if (bullet) {
    applyBossBreakPressure(
      state,
      enemy,
      actualDamage,
      (bullet.breakPower ?? 1) * weakPoint.breakPower,
    );
    applyEnemyHitFeedback(state, enemy, bullet, actualDamage, enemy.hp <= 0);
    if (tankScale < 1 && Math.random() < 0.16) {
      addFloatingText(state, enemy.x, enemy.y - enemy.radius, "BLOCK", HERO_STRIKE_COLORS.shield, 10);
    }
    if (weakPoint.weak && Math.random() < 0.3) {
      addFloatingText(state, enemy.x, enemy.y - enemy.radius - 8, "WEAK", HERO_STRIKE_COLORS.gold, 11);
    }
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
  const range = getChainRange(chainCount) * (arcOverload ? 1.12 : 1);
  const candidates = state.enemies
    .filter((enemy) => !enemy.dead && enemy.id !== source.id)
    .map((enemy) => ({ enemy, distance: distanceSquared(source.x, source.y, enemy.x, enemy.y) }))
    .filter((entry) => entry.distance <= range * range)
    .sort((left, right) => left.distance - right.distance)
    .slice(0, chainCount);

  for (let index = 0; index < candidates.length; index += 1) {
    const target = candidates[index].enemy;
    addBurst(state, target.x, target.y, HERO_STRIKE_COLORS.lime, arcOverload ? 5 : 3, 72, 1.8);
    const evolutionScale = arcOverload ? 1.18 : 1;
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
