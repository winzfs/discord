import { playHeroStrikeSound } from "./heroStrikeAudio";
import { isHeroStrikeFocus } from "./heroStrikeCombatControl";
import {
  getArcRailProfile,
  getBreacherScatterProfile,
  getPulseRepeaterProfile,
} from "./heroStrikePrimaryWeaponProfiles";
import type { HeroStrikeState, PrimaryWeaponId } from "./heroStrikeTypes";

export type HeroStrikePrimaryAction =
  | {
      kind: "pulse";
      focus: boolean;
      shotIndex: number;
      burstSize: number;
      finalShot: boolean;
      heat: number;
    }
  | {
      kind: "scatter";
      focus: boolean;
      pellets: number;
      shellsAfter: number;
    }
  | {
      kind: "rail";
      charge: number;
      fullCharge: boolean;
      sideBeams: number;
    };

type PrimaryWeaponRuntime = {
  weapon: PrimaryWeaponId;
  cycleTimer: number;
  shotTimer: number;
  burstRemaining: number;
  burstSize: number;
  heat: number;
  overheated: boolean;
  shells: number;
  reloadTimer: number;
  railCharge: number;
  railFiredInFocus: boolean;
  railReadyNotified: boolean;
  lastFocus: boolean;
  muzzleFlash: number;
  recoil: number;
};

const runtimeByState = new WeakMap<HeroStrikeState, PrimaryWeaponRuntime>();

function createRuntime(weapon: PrimaryWeaponId): PrimaryWeaponRuntime {
  return {
    weapon,
    cycleTimer: 0,
    shotTimer: 0,
    burstRemaining: 0,
    burstSize: 0,
    heat: 0,
    overheated: false,
    shells: 5,
    reloadTimer: 0,
    railCharge: 0.28,
    railFiredInFocus: false,
    railReadyNotified: false,
    lastFocus: false,
    muzzleFlash: 0,
    recoil: 0,
  };
}

function getRuntime(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime || runtime.weapon !== state.loadout.primary) {
    runtime = createRuntime(state.loadout.primary);
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function resetHeroStrikePrimaryWeaponSystem(state: HeroStrikeState) {
  runtimeByState.set(state, createRuntime(state.loadout.primary));
}

function updatePulse(state: HeroStrikeState, dt: number, runtime: PrimaryWeaponRuntime) {
  const profile = getPulseRepeaterProfile(state);
  const focus = isHeroStrikeFocus(state);
  const cooling = focus ? profile.focusCooling : profile.driveCooling;
  runtime.heat = Math.max(0, runtime.heat - cooling * dt);
  runtime.cycleTimer = Math.max(0, runtime.cycleTimer - dt);
  runtime.shotTimer = Math.max(0, runtime.shotTimer - dt);

  if (runtime.overheated) {
    runtime.burstRemaining = 0;
    if (runtime.heat <= profile.overheatRelease) {
      runtime.overheated = false;
      playHeroStrikeSound("weapon-ready", 0.72);
    }
    return [];
  }

  if (runtime.burstRemaining <= 0 && runtime.cycleTimer <= 0) {
    runtime.burstSize = focus ? profile.focusBurst : profile.driveBurst;
    runtime.burstRemaining = runtime.burstSize;
    runtime.shotTimer = 0;
  }
  if (runtime.burstRemaining <= 0 || runtime.shotTimer > 0) return [];

  const shotIndex = runtime.burstSize - runtime.burstRemaining;
  runtime.burstRemaining -= 1;
  runtime.heat = Math.min(1.05, runtime.heat + profile.heatPerShot);
  runtime.shotTimer = profile.shotGap;
  const finalShot = runtime.burstRemaining <= 0;
  if (finalShot) runtime.cycleTimer = focus ? profile.focusRecovery : profile.driveRecovery;
  if (runtime.heat >= 1) {
    runtime.overheated = true;
    runtime.burstRemaining = 0;
    runtime.cycleTimer = 0.5;
    playHeroStrikeSound("weapon-vent", 1);
  }
  runtime.muzzleFlash = 0.08;
  runtime.recoil = Math.max(runtime.recoil, finalShot ? 1 : 0.55);
  return [{ kind: "pulse", focus, shotIndex, burstSize: runtime.burstSize, finalShot, heat: runtime.heat } satisfies HeroStrikePrimaryAction];
}

function startScatterReload(runtime: PrimaryWeaponRuntime, reloadTime: number) {
  if (runtime.reloadTimer > 0) return;
  runtime.reloadTimer = reloadTime;
  playHeroStrikeSound("weapon-reload", 0.9);
}

function updateScatter(state: HeroStrikeState, dt: number, runtime: PrimaryWeaponRuntime) {
  const profile = getBreacherScatterProfile(state);
  const focus = isHeroStrikeFocus(state);
  runtime.cycleTimer = Math.max(0, runtime.cycleTimer - dt);

  if (runtime.reloadTimer > 0) {
    const reloadScale = focus ? 1 : 1.14;
    runtime.reloadTimer = Math.max(0, runtime.reloadTimer - dt * reloadScale);
    if (runtime.reloadTimer <= 0) {
      runtime.shells = profile.magazine;
      playHeroStrikeSound("weapon-ready", 0.9);
    }
    return [];
  }
  if (runtime.shells <= 0) {
    startScatterReload(runtime, profile.reloadTime);
    return [];
  }
  if (runtime.cycleTimer > 0) return [];

  runtime.shells -= 1;
  runtime.cycleTimer = profile.pumpTime;
  if (runtime.shells <= 0) startScatterReload(runtime, profile.reloadTime);
  runtime.muzzleFlash = 0.13;
  runtime.recoil = 1;
  return [{
    kind: "scatter",
    focus,
    pellets: focus ? profile.focusPellets : profile.drivePellets,
    shellsAfter: runtime.shells,
  } satisfies HeroStrikePrimaryAction];
}

function updateRail(state: HeroStrikeState, dt: number, runtime: PrimaryWeaponRuntime) {
  const profile = getArcRailProfile(state);
  const focus = isHeroStrikeFocus(state);
  if (!focus) {
    const previousCharge = runtime.railCharge;
    runtime.railCharge = Math.min(1, runtime.railCharge + dt * profile.chargeRate);
    runtime.railFiredInFocus = false;
    runtime.lastFocus = false;
    if (!runtime.railReadyNotified && previousCharge < profile.fullCharge && runtime.railCharge >= profile.fullCharge) {
      runtime.railReadyNotified = true;
      playHeroStrikeSound("weapon-ready", 1.05);
    }
    return [];
  }

  const enteringFocus = !runtime.lastFocus;
  runtime.lastFocus = true;
  if (!enteringFocus || runtime.railFiredInFocus || runtime.railCharge < profile.minimumCharge) return [];

  const charge = runtime.railCharge;
  runtime.railCharge = 0;
  runtime.railFiredInFocus = true;
  runtime.railReadyNotified = false;
  runtime.muzzleFlash = 0.18;
  runtime.recoil = 1;
  return [{
    kind: "rail",
    charge,
    fullCharge: charge >= profile.fullCharge,
    sideBeams: profile.sideBeams,
  } satisfies HeroStrikePrimaryAction];
}

export function updateHeroStrikePrimaryWeaponSystem(state: HeroStrikeState, dt: number) {
  const runtime = getRuntime(state);
  runtime.muzzleFlash = Math.max(0, runtime.muzzleFlash - dt);
  runtime.recoil = Math.max(0, runtime.recoil - dt * 7.5);
  if (state.loadout.primary === "scatter-array") return updateScatter(state, dt, runtime);
  if (state.loadout.primary === "rail-driver") return updateRail(state, dt, runtime);
  return updatePulse(state, dt, runtime);
}

export function getHeroStrikePrimaryWeaponStatus(state: HeroStrikeState) {
  const runtime = getRuntime(state);
  if (state.loadout.primary === "scatter-array") {
    const profile = getBreacherScatterProfile(state);
    const reloading = runtime.reloadTimer > 0;
    return {
      kind: "scatter" as const,
      label: reloading ? "RELOADING" : `SHELL ${runtime.shells}/${profile.magazine}`,
      ratio: reloading ? 1 - runtime.reloadTimer / profile.reloadTime : runtime.shells / profile.magazine,
      warning: reloading,
      muzzleFlash: runtime.muzzleFlash,
      recoil: runtime.recoil,
      shells: runtime.shells,
      magazine: profile.magazine,
    };
  }
  if (state.loadout.primary === "rail-driver") {
    const profile = getArcRailProfile(state);
    return {
      kind: "rail" as const,
      label: runtime.railCharge >= profile.fullCharge ? "CAPACITOR READY" : `CHARGE ${Math.round(runtime.railCharge * 100)}%`,
      ratio: runtime.railCharge,
      warning: false,
      muzzleFlash: runtime.muzzleFlash,
      recoil: runtime.recoil,
    };
  }
  return {
    kind: "pulse" as const,
    label: runtime.overheated ? "OVERHEAT" : `HEAT ${Math.round(runtime.heat * 100)}%`,
    ratio: runtime.heat,
    warning: runtime.overheated || runtime.heat >= 0.82,
    muzzleFlash: runtime.muzzleFlash,
    recoil: runtime.recoil,
  };
}
