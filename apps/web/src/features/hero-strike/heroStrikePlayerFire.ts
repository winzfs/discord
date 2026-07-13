import { playHeroStrikeSound } from "./heroStrikeAudio";
import {
  getHeroStrikeAimAngle,
  getHeroStrikePrimaryDamageScale,
  getHeroStrikePrimaryIntervalScale,
  getHeroStrikeSupportDamageScale,
} from "./heroStrikeCombatControl";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { addFloatingText, addRing } from "./heroStrikeEffects";
import { hasEvolution } from "./heroStrikeEvolutions";
import {
  getHeroStrikeFlowDamageMultiplier,
  getHeroStrikeFlowFireRateMultiplier,
  isHeroStrikeFlowRush,
} from "./heroStrikeFlow";
import {
  getArcRailProfile,
  getBreacherScatterProfile,
} from "./heroStrikePrimaryWeaponProfiles";
import {
  type HeroStrikePrimaryAction,
  updateHeroStrikePrimaryWeaponSystem,
} from "./heroStrikePrimaryWeaponSystem";
import { getHeroStrikeSupportBaseDamage } from "./heroStrikeSupportBalance";
import {
  getExplosionRadius,
  getRearGuardAngles,
  getRearGuardDamageScale,
  getSideCannonAngles,
  getSideCannonDamageScale,
} from "./heroStrikeUpgradeScaling";
import type {
  HeroStrikeState,
  PlayerBulletStyle,
  PrimaryWeaponId,
} from "./heroStrikeTypes";

type PlayerBulletOptions = {
  baseDamage?: number;
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
  const baseDamage = options.baseDamage ?? player.damage;
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
    damage: baseDamage
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
  const sweepPosition = action.burstSize <= 1
    ? 0
    : action.shotIndex / (action.burstSize - 1) - 0.5;
  const modeAngle = action.focus
    ? barrel * 0.004
    : sweepPosition * 0.28 + barrel * 0.01;
  const hotFinal = action.finalShot && action.redline;
  const heatPressure = 1 + Math.max(0, action.heat - 0.35) * 0.32;
  const redlineScale = action.redline ? 1.1 : 1;
  spawnPlayerBullet(state, aim + modeAngle, {
    xOffset: barrel * (action.focus ? 5 : 9),
    damageScale: (action.focus ? 1.34 : 0.76)
      * heatPressure
      * redlineScale
      * (hotFinal ? 1.18 : 1),
    pierce: state.player.pierce + (action.focus ? 1 : 0),
    style: "pulse-blasters",
    radius: hotFinal ? 5.7 : action.focus ? 4.8 : action.redline ? 4.5 : 3.8,
    speedScale: action.focus ? 1.18 : 0.92,
    life: action.focus ? 1.55 : 1.12,
    impactForce: hotFinal ? 34 : action.focus ? 27 : 13,
    breakPower: hotFinal ? 1.6 : action.focus ? 1.28 : 0.66,
    explosionScale: action.redline ? 0.34 : action.focus ? 0.24 : 0.14,
    color: action.redline
      ? HERO_STRIKE_COLORS.gold
      : action.focus
        ? HERO_STRIKE_COLORS.white
        : HERO_STRIKE_COLORS.cyan,
  });
  playHeroStrikeSound("pulse-shot", hotFinal ? 1.24 : action.focus ? 1.04 : 0.55);
  if (hotFinal) state.shake = Math.max(state.shake, 0.12);
}

function firePulseVentAction(
  state: HeroStrikeState,
  action: Extract<HeroStrikePrimaryAction, { kind: "pulse-vent" }>,
) {
  const aim = getHeroStrikeAimAngle(state);
  const bolts = action.focus ? 3 : 7;
  const center = (bolts - 1) / 2;
  const spread = action.focus ? 0.045 : 0.085;
  for (let index = 0; index < bolts; index += 1) {
    const position = index - center;
    spawnPlayerBullet(state, aim + position * spread, {
      xOffset: position * (action.focus ? 3.2 : 4.4),
      damageScale: action.focus ? 0.48 : 0.23,
      style: "pulse-blasters",
      radius: action.focus ? 5.2 : 4.5,
      speedScale: action.focus ? 1.12 : 0.86,
      life: action.focus ? 0.82 : 0.58,
      pierce: state.player.pierce + (action.focus ? 2 : 1),
      explosionScale: action.focus ? 0.42 : 0.28,
      breakPower: action.focus ? 1.08 : 0.5,
      impactForce: action.focus ? 29 : 18,
      color: action.pulseIndex === action.pulseCount - 1
        ? HERO_STRIKE_COLORS.gold
        : action.focus
          ? HERO_STRIKE_COLORS.white
          : HERO_STRIKE_COLORS.cyan,
    });
  }
  if (action.pulseIndex === 0) {
    addFloatingText(
      state,
      state.player.x,
      state.player.y - 62,
      action.focus ? "FOCUS PURGE" : "DRIVE PURGE",
      action.focus ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.cyan,
      12,
    );
  }
  addRing(
    state,
    state.player.x,
    state.player.y - 28,
    action.pulseIndex === action.pulseCount - 1 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan,
    14 + action.pulseIndex * 3,
  );
  state.shake = Math.max(state.shake, action.focus ? 0.18 : 0.1);
  playHeroStrikeSound("weapon-vent", action.focus ? 0.98 : 0.66);
}

function fireScatterAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "scatter" }>) {
  const profile = getBreacherScatterProfile(state);
  const aim = getHeroStrikeAimAngle(state);
  const centered = (action.pellets - 1) / 2;
  const emergency = action.slamLoaded || (action.focus && action.shellsSpent === 1);
  const spread = emergency
    ? profile.emergencySpread
    : action.focus
      ? profile.focusSpread
      : profile.driveSpread;
  const baseDamageScale = emergency
    ? profile.emergencyDamageScale
    : action.focus
      ? profile.focusDamageScale
      : profile.driveDamageScale;
  const breachNova = hasEvolution(state, "breach-nova") && action.shellsAfter === 0;
  const damageScale = baseDamageScale
    * (action.shellsSpent >= 2 ? 1.1 : 1)
    * (action.slamLoaded ? 1.18 : 1)
    * (breachNova ? 1.38 : 1);

  for (let index = 0; index < action.pellets; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, aim + position * spread, {
      xOffset: Math.max(-16, Math.min(16, position * (action.focus ? 2.1 : 3.5))),
      damageScale,
      pierce: state.player.pierce + (action.focus ? 1 : 0),
      style: "scatter-array",
      radius: breachNova ? 6.5 : emergency ? 5.5 : action.focus ? 5.8 : 4,
      life: action.focus ? 0.9 : emergency ? 0.72 : 0.54,
      speedScale: action.focus ? 1.12 : emergency ? 0.92 : 0.8,
      impactForce: breachNova ? 52 : emergency ? 39 : action.focus ? 43 : 17,
      breakPower: breachNova ? 2.3 : emergency ? 1.52 : action.focus ? 1.78 : 0.58,
      explosionScale: breachNova ? 1.22 : emergency ? 0.62 : action.focus ? 0.58 : 0.36,
      color: breachNova || action.slamLoaded
        ? HERO_STRIKE_COLORS.gold
        : action.focus
          ? HERO_STRIKE_COLORS.white
          : HERO_STRIKE_COLORS.orange,
    });
  }

  if (action.slamLoaded) {
    addRing(state, state.player.x, state.player.y - 28, HERO_STRIKE_COLORS.orange, 15);
    addFloatingText(state, state.player.x, state.player.y - 58, "SLAM LOAD", HERO_STRIKE_COLORS.orange, 11);
  }
  if (breachNova) {
    addRing(state, state.player.x, state.player.y - 28, HERO_STRIKE_COLORS.gold, 20);
    addFloatingText(state, state.player.x, state.player.y - 72, "BREACH NOVA", HERO_STRIKE_COLORS.gold, 13);
    state.hitStop = Math.max(state.hitStop, 0.04);
  }
  state.shake = Math.max(
    state.shake,
    breachNova ? 0.42 : action.slamLoaded ? 0.28 : action.focus ? 0.3 : 0.09,
  );
  playHeroStrikeSound(
    "scatter-shot",
    breachNova ? 1.38 : action.slamLoaded ? 1.24 : action.focus ? 1.28 : 0.62,
  );
}

function fireRailSparkAction(
  state: HeroStrikeState,
  action: Extract<HeroStrikePrimaryAction, { kind: "rail-spark" }>,
) {
  const aim = getHeroStrikeAimAngle(state);
  const center = (action.beams - 1) / 2;
  for (let index = 0; index < action.beams; index += 1) {
    const position = index - center;
    const alternate = action.sparkIndex % 2 === 0 ? -1 : 1;
    spawnPlayerBullet(state, aim + position * 0.09 + alternate * 0.035, {
      xOffset: position * 9 + alternate * 4,
      damageScale: 0.16 + action.charge * 0.06,
      pierce: state.player.pierce,
      chain: Math.max(1, state.player.chainCoreLevel),
      style: "rail-driver",
      radius: 3 + action.charge * 0.7,
      speedScale: 1.02,
      life: 0.82,
      color: action.charge >= 0.88 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan,
      breakPower: 0.32 + action.charge * 0.16,
      impactForce: 11 + action.charge * 4,
      explosionScale: 0.12,
    });
  }
  playHeroStrikeSound("pulse-shot", 0.38 + action.charge * 0.14);
}

function fireRailAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "rail" }>) {
  const profile = getArcRailProfile(state);
  const aim = getHeroStrikeAimAngle(state);
  const chargeScale = profile.minimumDamageScale
    + (profile.maximumDamageScale - profile.minimumDamageScale) * action.charge;

  spawnPlayerBullet(state, aim, {
    damageScale: chargeScale,
    pierce: state.player.pierce + 4 + (action.fullCharge ? 3 : 0),
    style: "rail-driver",
    radius: action.fullCharge ? 9.2 : 6.8,
    speedScale: 1.38,
    life: 1.5,
    color: action.fullCharge ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white,
    breakPower: 2.1 + action.charge * 2.65,
    impactForce: 46 + action.charge * 32,
    explosionScale: 0.5,
  });

  for (let index = 0; index < action.sideBeams; index += 1) {
    const offset = 0.032 + index * 0.021;
    for (const direction of [-1, 1]) {
      spawnPlayerBullet(state, aim + offset * direction, {
        xOffset: direction * (10 + index * 4),
        damageScale: chargeScale * 0.22,
        pierce: state.player.pierce + 2,
        style: "rail-driver",
        radius: 3.6,
        speedScale: 1.3,
        life: 1.4,
        color: HERO_STRIKE_COLORS.cyan,
        breakPower: 0.62,
        impactForce: 20,
        explosionScale: 0.2,
      });
    }
  }

  state.shake = Math.max(state.shake, 0.3 + action.charge * 0.38);
  state.hitStop = Math.max(state.hitStop, 0.03 + action.charge * 0.045);
  playHeroStrikeSound("rail-shot", 0.9 + action.charge * 0.65);
}

function isMainPrimaryAction(action: HeroStrikePrimaryAction) {
  return action.kind === "pulse" || action.kind === "scatter" || action.kind === "rail";
}

function firePrimaryAction(state: HeroStrikeState, action: HeroStrikePrimaryAction) {
  if (action.kind === "pulse-vent") {
    firePulseVentAction(state, action);
    return;
  }
  if (action.kind === "rail-spark") {
    fireRailSparkAction(state, action);
    return;
  }

  state.player.shotCounter += 1;
  if (action.kind === "scatter") fireScatterAction(state, action);
  else if (action.kind === "rail") fireRailAction(state, action);
  else firePulseAction(state, action);

  const aim = getHeroStrikeAimAngle(state);
  if (hasEvolution(state, "pulse-storm") && action.kind === "pulse") {
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
  const supportDamage = getHeroStrikeSupportBaseDamage(state);
  for (const angle of getSideCannonAngles(level)) {
    spawnPlayerBullet(state, angle, {
      baseDamage: supportDamage,
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
  const supportDamage = getHeroStrikeSupportBaseDamage(state);
  for (const angle of getRearGuardAngles(level)) {
    spawnPlayerBullet(state, angle, {
      baseDamage: supportDamage,
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
  if (!isMainPrimaryAction(action)) return false;
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
