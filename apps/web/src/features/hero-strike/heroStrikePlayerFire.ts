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
  const hotFinal = action.finalShot && action.heat >= 0.68;
  spawnPlayerBullet(state, aim + barrel * 0.012, {
    xOffset: barrel * 7,
    damageScale: (action.focus ? 1.02 : 0.9) * (hotFinal ? 1.24 : 1),
    style: "pulse-blasters",
    radius: hotFinal ? 5 : 4,
    impactForce: hotFinal ? 27 : action.focus ? 19 : 14,
    breakPower: hotFinal ? 1.22 : action.focus ? 1 : 0.76,
  });
  playHeroStrikeSound("pulse-shot", hotFinal ? 1.18 : action.focus ? 0.9 : 0.62);
  if (hotFinal) state.shake = Math.max(state.shake, 0.08);
}

function fireScatterAction(state: HeroStrikeState, action: Extract<HeroStrikePrimaryAction, { kind: "scatter" }>) {
  const profile = getBreacherScatterProfile(state);
  const aim = getHeroStrikeAimAngle(state);
  const centered = (action.pellets - 1) / 2;
  const spread = action.focus ? profile.focusSpread : profile.driveSpread;
  const baseDamageScale = action.focus ? profile.focusDamageScale : profile.driveDamageScale;
  const breachNova = hasEvolution(state, "breach-nova") && action.shellsAfter === 0;
  const damageScale = baseDamageScale * (breachNova ? 1.35 : 1);

  for (let index = 0; index < action.pellets; index += 1) {
    const position = index - centered;
    spawnPlayerBullet(state, aim + position * spread, {
      xOffset: Math.max(-13, Math.min(13, position * 3.2)),
      damageScale,
      style: "scatter-array",
      radius: breachNova ? 6.1 : action.focus ? 5.1 : 4.1,
      life: action.focus ? 0.72 : 0.58,
      speedScale: action.focus ? 0.96 : 0.86,
      impactForce: breachNova ? 46 : action.focus ? 33 : 17,
      breakPower: breachNova ? 2.05 : action.focus ? 1.3 : 0.58,
      explosionScale: breachNova ? 1.18 : 0.48,
      color: breachNova ? HERO_STRIKE_COLORS.gold : undefined,
    });
  }
  if (breachNova) {
    addRing(state, state.player.x, state.player.y - 28, HERO_STRIKE_COLORS.gold, 18);
    addFloatingText(state, state.player.x, state.player.y - 58, "BREACH NOVA", HERO_STRIKE_COLORS.gold, 13);
    state.hitStop = Math.max(state.hitStop, 0.035);
  }
  state.shake = Math.max(state.shake, breachNova ? 0.38 : action.focus ? 0.2 : 0.1);
  playHeroStrikeSound("scatter-shot", breachNova ? 1.35 : action.focus ? 1.18 : 0.68);
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
