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
    driveBurst: 3 + (twin >= 2 ? 1 : 0),
    focusBurst: 5 + twin,
    shotGap: Math.max(0.046, 0.066 - rapid * 0.006),
    driveRecovery: Math.max(0.16, 0.24 - rapid * 0.022),
    focusRecovery: Math.max(0.24, 0.36 - rapid * 0.03),
    heatPerShot: Math.max(0.058, 0.086 - rapid * 0.006),
    driveCooling: 0.48 + rapid * 0.045,
    focusCooling: 0.24 + rapid * 0.025,
    overheatRelease: 0.28,
  };
}

export function getBreacherScatterProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    magazine: 5,
    drivePellets: 2 + (twin >= 2 ? 1 : 0),
    focusPellets: 6 + twin,
    driveSpread: 0.27,
    focusSpread: Math.max(0.06, 0.095 - twin * 0.014),
    drivePumpTime: Math.max(0.32, 0.44 - rapid * 0.035),
    focusPumpTime: Math.max(0.43, 0.58 - rapid * 0.045),
    driveReloadTime: Math.max(0.88, 1.2 - rapid * 0.08),
    focusReloadTime: Math.max(1.05, 1.45 - rapid * 0.1),
    driveDamageScale: 0.58,
    focusDamageScale: 0.42,
  };
}

export function getArcRailProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    chargeRate: 0.52 + rapid * 0.085,
    minimumCharge: 0.25,
    fullCharge: 0.9,
    sideBeams: twin,
    minimumDamageScale: 0.62,
    maximumDamageScale: 2.65,
  };
}
