import type { HeroStrikeState } from "./heroStrikeTypes";

type WeaponProfileOverrides = {
  rapid?: number;
  twin?: number;
};

function upgradeLevel(
  state: HeroStrikeState,
  id: "rapid-fire" | "twin-shot",
  override?: number,
) {
  return override ?? state.upgradeLevels[id] ?? 0;
}

export function getPulseRepeaterProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  const driveShotGap = Math.max(0.033, 0.047 - rapid * 0.004);
  const focusShotGap = Math.max(0.021, 0.032 - rapid * 0.003);
  const driveHeatPerShot = Math.max(0.018, 0.029 - rapid * 0.003);
  const focusHeatPerShot = Math.max(0.038, 0.056 - rapid * 0.004);
  return {
    driveBurst: 4 + (twin >= 2 ? 1 : 0),
    focusBurst: 8 + twin,
    driveShotGap,
    focusShotGap,
    shotGap: focusShotGap,
    driveRecovery: Math.max(0.075, 0.12 - rapid * 0.012),
    focusRecovery: Math.max(0.11, 0.17 - rapid * 0.015),
    driveHeatPerShot,
    focusHeatPerShot,
    heatPerShot: focusHeatPerShot,
    driveCooling: 0.8 + rapid * 0.055,
    focusCooling: 0.16 + rapid * 0.025,
    redlineStart: 0.72,
    ventPulseCount: 2 + (twin >= 3 ? 1 : 0),
    ventPulseGap: Math.max(0.026, 0.038 - rapid * 0.004),
    ventResetHeat: 0.1,
  };
}

export function getBreacherScatterProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    magazine: 6,
    drivePellets: 5 + (twin >= 2 ? 1 : 0),
    focusPellets: 10 + twin,
    emergencyPellets: 6 + Math.floor(twin / 2),
    driveSpread: 0.11,
    focusSpread: Math.max(0.012, 0.026 - twin * 0.003),
    emergencySpread: 0.095,
    drivePumpTime: Math.max(0.19, 0.28 - rapid * 0.024),
    focusPumpTime: Math.max(0.36, 0.5 - rapid * 0.035),
    driveShellLoadTime: Math.max(0.19, 0.28 - rapid * 0.024),
    focusShellLoadTime: Math.max(0.32, 0.46 - rapid * 0.035),
    emergencyShellLoadTime: Math.max(0.13, 0.2 - rapid * 0.016),
    driveDamageScale: 0.43,
    focusDamageScale: 0.62,
    emergencyDamageScale: 0.52,
  };
}

export function getArcRailProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    chargeRate: 0.62 + rapid * 0.095,
    minimumCharge: 0.22,
    fullCharge: 0.88,
    sideBeams: twin,
    sparkBeams: 1 + (twin >= 2 ? 1 : 0),
    sparkInterval: Math.max(0.14, 0.22 - rapid * 0.018),
    minimumDamageScale: 0.9,
    maximumDamageScale: 3.35,
  };
}
