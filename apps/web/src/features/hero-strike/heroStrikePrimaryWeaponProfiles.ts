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
  const burst = 5 + Math.min(1, twin);
  return {
    driveBurst: burst,
    focusBurst: burst,
    shotGap: Math.max(0.046, 0.068 - rapid * 0.006),
    driveRecovery: Math.max(0.22, 0.32 - rapid * 0.025),
    focusRecovery: Math.max(0.22, 0.32 - rapid * 0.025),
    heatPerShot: Math.max(0.055, 0.08 - rapid * 0.005),
    driveCooling: 0.34 + rapid * 0.04,
    focusCooling: 0.34 + rapid * 0.04,
    overheatRelease: 0.3,
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
    drivePellets: 5 + (twin >= 2 ? 1 : 0),
    focusPellets: 6 + twin,
    driveSpread: 0.21,
    focusSpread: Math.max(0.065, 0.1 - twin * 0.012),
    pumpTime: Math.max(0.38, 0.54 - rapid * 0.045),
    reloadTime: Math.max(1.05, 1.45 - rapid * 0.1),
    driveDamageScale: 0.21,
    focusDamageScale: 0.16,
  };
}

export function getArcRailProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    chargeRate: 0.42 + rapid * 0.07,
    minimumCharge: 0.28,
    fullCharge: 0.9,
    sideBeams: twin,
    minimumDamageScale: 0.58,
    maximumDamageScale: 2.35,
    drivePulseInterval: Math.max(0.24, 0.34 - rapid * 0.035),
    focusPulseInterval: Math.max(0.2, 0.28 - rapid * 0.03),
  };
}
