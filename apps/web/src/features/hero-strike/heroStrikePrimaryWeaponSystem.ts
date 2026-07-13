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
      redline: boolean;
    }
  | {
      kind: "pulse-vent";
      focus: boolean;
      pulseIndex: number;
      pulseCount: number;
    }
  | {
      kind: "scatter";
      focus: boolean;
      pellets: number;
      shellsBefore: number;
      shellsAfter: number;
      shellsSpent: number;
      slamLoaded: boolean;
    }
  | {
      kind: "rail-spark";
      charge: number;
      beams: number;
      sparkIndex: number;
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
  ventPulseTimer: number;
  ventPulsesRemaining: number;
  ventPulseCount: number;
  shells: number;
  reloadTimer: number;
  reloadDuration: number;
  shellLoadedFromEmpty: boolean;
  railCharge: number;
  railFiredInFocus: boolean;
  railReadyNotified: boolean;
  railSparkTimer: number;
  railSparkCounter: number;
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
    ventPulseTimer: 0,
    ventPulsesRemaining: 0,
    ventPulseCount: 0,
    shells: 6,
    reloadTimer: 0,
    reloadDuration: 0,
    shellLoadedFromEmpty: false,
    railCharge: 0.22,
    railFiredInFocus: false,
    railReadyNotified: false,
    railSparkTimer: 0,
    railSparkCounter: 0,
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

function updatePulseVent(
  state: HeroStrikeState,
  dt: number,
  runtime: PrimaryWeaponRuntime,
) {
  const profile = getPulseRepeaterProfile(state);
  runtime.ventPulseTimer = Math.max(0, runtime.ventPulseTimer - dt);
  if (runtime.ventPulseTimer > 0 || runtime.ventPulsesRemaining <= 0) return [];

  const pulseIndex = runtime.ventPulseCount - runtime.ventPulsesRemaining;
  runtime.ventPulsesRemaining -= 1;
  runtime.ventPulseTimer = profile.ventPulseGap;
  runtime.heat = Math.max(
    profile.ventResetHeat,
    runtime.heat - (1 - profile.ventResetHeat) / runtime.ventPulseCount,
  );
  runtime.muzzleFlash = 0.11;
  runtime.recoil = Math.max(runtime.recoil, 0.72);

  if (runtime.ventPulsesRemaining <= 0) {
    runtime.overheated = false;
    runtime.heat = profile.ventResetHeat;
    runtime.cycleTimer = Math.min(runtime.cycleTimer, 0.11);
    playHeroStrikeSound("weapon-ready", 0.82);
  }

  return [{
    kind: "pulse-vent",
    focus: isHeroStrikeFocus(state),
    pulseIndex,
    pulseCount: runtime.ventPulseCount,
  } satisfies HeroStrikePrimaryAction];
}

function updatePulse(state: HeroStrikeState, dt: number, runtime: PrimaryWeaponRuntime) {
  const profile = getPulseRepeaterProfile(state);
  const focus = isHeroStrikeFocus(state);
  runtime.cycleTimer = Math.max(0, runtime.cycleTimer - dt);
  runtime.shotTimer = Math.max(0, runtime.shotTimer - dt);

  if (runtime.overheated) return updatePulseVent(state, dt, runtime);

  const cooling = focus ? profile.focusCooling : profile.driveCooling;
  runtime.heat = Math.max(0, runtime.heat - cooling * dt);

  if (runtime.burstRemaining <= 0 && runtime.cycleTimer <= 0) {
    runtime.burstSize = focus ? profile.focusBurst : profile.driveBurst;
    runtime.burstRemaining = runtime.burstSize;
    runtime.shotTimer = 0;
  }
  if (runtime.burstRemaining <= 0 || runtime.shotTimer > 0) return [];

  const shotIndex = runtime.burstSize - runtime.burstRemaining;
  runtime.burstRemaining -= 1;
  runtime.heat = Math.min(1.08, runtime.heat + profile.heatPerShot);
  runtime.shotTimer = profile.shotGap;
  const finalShot = runtime.burstRemaining <= 0;
  if (finalShot) runtime.cycleTimer = focus ? profile.focusRecovery : profile.driveRecovery;

  const redline = runtime.heat >= profile.redlineStart;
  if (runtime.heat >= 1) {
    runtime.overheated = true;
    runtime.burstRemaining = 0;
    runtime.ventPulseCount = profile.ventPulseCount;
    runtime.ventPulsesRemaining = profile.ventPulseCount;
    runtime.ventPulseTimer = 0.055;
    playHeroStrikeSound("weapon-vent", 1);
  }

  runtime.muzzleFlash = 0.08;
  runtime.recoil = Math.max(runtime.recoil, finalShot ? 1 : redline ? 0.7 : 0.52);
  return [{
    kind: "pulse",
    focus,
    shotIndex,
    burstSize: runtime.burstSize,
    finalShot,
    heat: runtime.heat,
    redline,
  } satisfies HeroStrikePrimaryAction];
}

function scatterShellLoadTime(
  state: HeroStrikeState,
  runtime: PrimaryWeaponRuntime,
  focus: boolean,
) {
  const profile = getBreacherScatterProfile(state);
  if (runtime.shells <= 0) return profile.emergencyShellLoadTime;
  return focus ? profile.focusShellLoadTime : profile.driveShellLoadTime;
}

function startScatterShellLoad(
  state: HeroStrikeState,
  runtime: PrimaryWeaponRuntime,
  focus: boolean,
) {
  const profile = getBreacherScatterProfile(state);
  if (runtime.shells >= profile.magazine || runtime.reloadTimer > 0) return;
  const loadTime = scatterShellLoadTime(state, runtime, focus);
  runtime.reloadTimer = loadTime;
  runtime.reloadDuration = loadTime;
  if (runtime.shells <= 0) playHeroStrikeSound("weapon-reload", 0.92);
}

function updateScatterLoader(
  state: HeroStrikeState,
  dt: number,
  runtime: PrimaryWeaponRuntime,
  focus: boolean,
) {
  const profile = getBreacherScatterProfile(state);
  if (runtime.shells >= profile.magazine) {
    runtime.reloadTimer = 0;
    runtime.reloadDuration = 0;
    return;
  }

  startScatterShellLoad(state, runtime, focus);
  runtime.reloadTimer = Math.max(0, runtime.reloadTimer - dt);
  if (runtime.reloadTimer > 0) return;

  const loadedFromEmpty = runtime.shells <= 0;
  runtime.shells = Math.min(profile.magazine, runtime.shells + 1);
  runtime.shellLoadedFromEmpty = loadedFromEmpty;
  runtime.reloadDuration = 0;
  if (loadedFromEmpty) playHeroStrikeSound("weapon-ready", 0.9);
}

function updateScatter(state: HeroStrikeState, dt: number, runtime: PrimaryWeaponRuntime) {
  const profile = getBreacherScatterProfile(state);
  const focus = isHeroStrikeFocus(state);
  runtime.cycleTimer = Math.max(0, runtime.cycleTimer - dt);
  updateScatterLoader(state, dt, runtime, focus);

  if (runtime.shells <= 0 || runtime.cycleTimer > 0) return [];

  const shellsBefore = runtime.shells;
  const slamLoaded = runtime.shellLoadedFromEmpty;
  const shellsSpent = focus && runtime.shells >= 2 ? 2 : 1;
  const emergency = slamLoaded || (focus && shellsSpent === 1);
  const pellets = emergency
    ? profile.emergencyPellets
    : focus
      ? profile.focusPellets
      : profile.drivePellets;

  runtime.shells -= shellsSpent;
  runtime.shellLoadedFromEmpty = false;
  runtime.cycleTimer = emergency
    ? Math.min(profile.drivePumpTime, profile.focusPumpTime * 0.72)
    : focus
      ? profile.focusPumpTime
      : profile.drivePumpTime;
  startScatterShellLoad(state, runtime, focus);
  runtime.muzzleFlash = emergency ? 0.16 : 0.13;
  runtime.recoil = emergency ? 1 : focus ? 0.95 : 0.72;

  return [{
    kind: "scatter",
    focus,
    pellets,
    shellsBefore,
    shellsAfter: runtime.shells,
    shellsSpent,
    slamLoaded,
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
    runtime.railSparkTimer = Math.max(0, runtime.railSparkTimer - dt);

    if (!runtime.railReadyNotified && previousCharge < profile.fullCharge && runtime.railCharge >= profile.fullCharge) {
      runtime.railReadyNotified = true;
      playHeroStrikeSound("weapon-ready", 1.05);
    }
    if (runtime.railCharge < profile.minimumCharge || runtime.railSparkTimer > 0) return [];

    const sparkIndex = runtime.railSparkCounter;
    runtime.railSparkCounter += 1;
    runtime.railSparkTimer = profile.sparkInterval;
    runtime.muzzleFlash = 0.055;
    runtime.recoil = Math.max(runtime.recoil, 0.22);
    return [{
      kind: "rail-spark",
      charge: runtime.railCharge,
      beams: profile.sparkBeams,
      sparkIndex,
    } satisfies HeroStrikePrimaryAction];
  }

  const enteringFocus = !runtime.lastFocus;
  runtime.lastFocus = true;
  if (!enteringFocus || runtime.railFiredInFocus || runtime.railCharge < profile.minimumCharge) return [];

  const charge = runtime.railCharge;
  runtime.railCharge = 0;
  runtime.railFiredInFocus = true;
  runtime.railReadyNotified = false;
  runtime.railSparkTimer = profile.sparkInterval;
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
    const loading = runtime.shells < profile.magazine && runtime.reloadTimer > 0;
    const loadRatio = loading
      ? 1 - runtime.reloadTimer / Math.max(0.01, runtime.reloadDuration)
      : 0;
    return {
      kind: "scatter" as const,
      label: runtime.shells <= 0
        ? `SLAM LOAD ${Math.round(loadRatio * 100)}%`
        : loading
          ? `AUTOLOAD ${runtime.shells}/${profile.magazine}`
          : `SHELL ${runtime.shells}/${profile.magazine}`,
      ratio: runtime.shells <= 0 ? loadRatio : runtime.shells / profile.magazine,
      warning: runtime.shells <= 0,
      muzzleFlash: runtime.muzzleFlash,
      recoil: runtime.recoil,
      shells: runtime.shells,
      magazine: profile.magazine,
      loadingShell: loading,
      loadRatio,
    };
  }
  if (state.loadout.primary === "rail-driver") {
    const profile = getArcRailProfile(state);
    const focus = isHeroStrikeFocus(state);
    const chargeLabel = runtime.railCharge >= profile.fullCharge
      ? "CAPACITOR READY"
      : `SPARK CHARGE ${Math.round(runtime.railCharge * 100)}%`;
    return {
      kind: "rail" as const,
      label: focus && runtime.railFiredInFocus ? "REPOSITION TO CHARGE" : chargeLabel,
      ratio: runtime.railCharge,
      warning: focus && runtime.railFiredInFocus,
      muzzleFlash: runtime.muzzleFlash,
      recoil: runtime.recoil,
    };
  }
  const profile = getPulseRepeaterProfile(state);
  return {
    kind: "pulse" as const,
    label: runtime.overheated
      ? `THERMAL PURGE ${runtime.ventPulsesRemaining}`
      : runtime.heat >= profile.redlineStart
        ? `REDLINE ${Math.round(runtime.heat * 100)}%`
        : `HEAT ${Math.round(runtime.heat * 100)}%`,
    ratio: runtime.heat,
    warning: runtime.overheated || runtime.heat >= profile.redlineStart,
    muzzleFlash: runtime.muzzleFlash,
    recoil: runtime.recoil,
  };
}
