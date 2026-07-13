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
  return {
    driveBurst: 4 + (twin >= 2 ? 1 : 0),
    focusBurst: 6 + twin,
    shotGap: Math.max(0.038, 0.058 - rapid * 0.005),
    driveRecovery: Math.max(0.12, 0.19 - rapid * 0.018),
    focusRecovery: Math.max(0.18, 0.27 - rapid * 0.024),
    heatPerShot: Math.max(0.052, 0.074 - rapid * 0.004),
    driveCooling: 0.34 + rapid * 0.035,
    focusCooling: 0.14 + rapid * 0.018,
    redlineStart: 0.62,
    ventPulseCount: 3 + (twin >= 3 ? 1 : 0),
    ventPulseGap: Math.max(0.075, 0.11 - rapid * 0.008),
    ventResetHeat: 0.3,
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
    drivePellets: 3 + (twin >= 2 ? 1 : 0),
    focusPellets: 8 + twin,
    emergencyPellets: 5 + Math.floor(twin / 2),
    driveSpread: 0.19,
    focusSpread: Math.max(0.045, 0.078 - twin * 0.01),
    emergencySpread: 0.12,
    drivePumpTime: Math.max(0.24, 0.34 - rapid * 0.028),
    focusPumpTime: Math.max(0.34, 0.48 - rapid * 0.035),
    driveShellLoadTime: Math.max(0.24, 0.36 - rapid * 0.028),
    focusShellLoadTime: Math.max(0.34, 0.5 - rapid * 0.035),
    emergencyShellLoadTime: Math.max(0.15, 0.23 - rapid * 0.018),
    driveDamageScale: 0.64,
    focusDamageScale: 0.48,
    emergencyDamageScale: 0.46,
  };
}

export function getArcRailProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    chargeRate: 0.58 + rapid * 0.09,
    minimumCharge: 0.22,
    fullCharge: 0.88,
    sideBeams: twin,
    sparkBeams: 1 + (twin >= 2 ? 1 : 0),
    sparkInterval: Math.max(0.15, 0.24 - rapid * 0.018),
    minimumDamageScale: 0.72,
    maximumDamageScale: 2.8,
  };
}
