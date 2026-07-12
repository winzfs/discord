import { playHeroStrikeSound } from "./heroStrikeAudio";
import { getEliteResearchReward } from "./heroStrikeBalance";
import { applyBossBreakPressure, getBossBreakDamageMultiplier } from "./heroStrikeBossBreak";
import {
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
import {
  getArcRailProfile,
  getBreacherScatterProfile,
} from "./heroStrikePrimaryWeaponProfiles";
import {
  type HeroStrikePrimaryAction,
  updateHeroStrikePrimaryWeaponSystem,
} from "./heroStrikePrimaryWeaponSystem";
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

function firePulseAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "pulse" }>) {
  const aim = getHeroStrikeAimAngle(state);
  const barrel = action.shotIndex % 2 === 0 ? -1 : 1;
  const hotFinal = action.finalShot && action.heat >= 0.72;
  spawnPlayerBullet(state, aim + barrel * 0.012, {
    xOffset: barrel * 7,
    damageScale: (action.focus ? 1.02 : 0.78) * (hotFinal ? 1.22 : 1),
    style: "pulse-blasters",
    radius: hotFinal ? 5 : 4,
    impactForce: hotFinal ? 27 : action.focus ? 19 : 13,
    breakPower: hotFinal ? 1.22 : action.focus ? 1 : 0.72,
  });
  playHeroStrikeSound("pulse-shot", hotFinal ? 1.18 : action.focus ? 0.9 : 0.58);
  if (hotFinal) state.shake = Math.max(state.shake, 0.08);
}

function fireScatterAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "scatter" }>) {
  const profile = getBreacherScatterProfile(state);
  const aim = getHeroStrikeAimAngle(state);
  const centered = (action.pellets - 1) / 2;
  const spread = action.focus ? profile.focusSpread : profile.driveSpread;
  const damageScale = action.focus ? profile.focusDamageScale : profile.driveDamageScale;

  for (let index = 0; index < action.pellets; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, aim + position * spread, {
      xOffset: Math.max(-13, Math.min(13, position * 3.2)),
      damageScale,
      style: "scatter-array",
      radius: action.focus ? 5.1 : 4.1,
      life: action.focus ? 0.72 : 0.58,
      speedScale: action.focus ? 0.96 : 0.86,
      impactForce: action.focus ? 33 : 17,
      breakPower: action.focus ? 1.3 : 0.58,
      explosionScale: 0.48,
    });
  }
  state.shake = Math.max(state.shake, action.focus ? 0.2 : 0.1);
  playHeroStrikeSound("scatter-shot", action.focus ? 1.18 : 0.68);
}

function fireRailAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "rail" }>) {
  const profile = getArcRailProfile(state);
  const aim = getHeroStrikeAimAngle(state);
  const chargeScale = profile.minimumDamageScale
    + (profile.maximumDamageScale - profile.minimumDamageScale) * action.charge;

  spawnPlayerBullet(state, aim, {
    damageScale: chargeScale,
    pierce: state.player.pierce + 3 + (action.fullCharge ? 2 : 0),
    style: "rail-driver",
    radius: action.fullCharge ? 8 : 6.2,
    speedScale: 1.28,
    life: 1.4,
    color: action.fullCharge ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white,
    breakPower: 1.7 + action.charge * 2.1,
    impactForce: 38 + action.charge * 26,
    explosionScale: 0.38,
  });

  for (let index = 0; index < action.sideBeams; index += 1) {
    const offset = 0.035 + index * 0.024;
    for (const direction of [-1, 1]) {
      spawnPlayerBullet(state, aim + offset * direction, {
        xOffset: direction * (10 + index * 4),
        damageScale: chargeScale * 0.2,
        pierce: state.player.pierce + 1,
        style: "rail-driver",
        radius: 3.4,
        speedScale: 1.22,
        life: 1.3,
        color: HERO_STRIKE_COLORS.cyan,
        breakPower: 0.5,
        impactForce: 17,
        explosionScale: 0.16,
      });
    }
  }

  state.shake = Math.max(state.shake, 0.22 + action.charge * 0.3);
  state.hitStop = Math.max(state.hitStop, 0.022 + action.charge * 0.035);
  playHeroStrikeSound("rail-shot", 0.78 + action.charge * 0.55);
}

function firePrimaryAction(state: HeroStrikeState, action: HeroStrikePrimaryAction) {
  state.player.shotCounter += 1;
  if (action.kind === "scatter") fireScatterAction(state, action);
  else if (action.kind === "rail") fireRailAction(state, action);
  else firePulseAction(state, action);

  const aim = getHeroStrikeAimAngle(state);
  if (hasEvolution(state, "pulse-storm") && action.kind !== "rail") {
    spawnPlayerBullet(state, aim - 0.3, { xOffset: -18, damageScale: 0.26, pierce: state.player.pierce + 1, style: "support" });
    spawnPlayerBullet(state, aim + 0.3, { xOffset: 18, damageScale: 0.26, pierce: state.player.pierce + 1, style: "support" });
  }
  if (isHeroStrikeFlowRush(state) && state.player.shotCounter % 4 === 0) {
    spawnPlayerBullet(state, aim - 0.22, { xOffset: -15, damageScale: 0.28, style: "support" });
    spawnPlayerBullet(state, aim + 0.22, { xOffset: 15, damageScale: 0.28, style: "support" });
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

function endsPrimaryCycle(action: HeroStrikePrimaryAction) {
  if (action.kind === "pulse") return action.finalShot;
  return true;
}

export function updatePlayerFire(state: HeroStrikeState, dt: number) {
  const timingScale = Math.max(
    0.42,
    state.player.campaignFireRateMultiplier
      * getHeroStrikeFlowFireRateMultiplier(state)
      * getHeroStrikePrimaryIntervalScale(state),
  );
  const actions = updateHeroStrikePrimaryWeaponSystem(state, dt / timingScale);
  for (const action of actions) {
    firePrimaryAction(state, action);
    if (endsPrimaryCycle(action)) {
      fireSideCannons(state);
      fireRearGuard(state);
    }
  }
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
