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
    shotGap: Math.max(0.045, 0.072 - rapid * 0.007),
    driveRecovery: Math.max(0.22, 0.34 - rapid * 0.03),
    focusRecovery: Math.max(0.3, 0.48 - rapid * 0.035),
    heatPerShot: Math.max(0.06, 0.09 - rapid * 0.006),
    driveCooling: 0.38 + rapid * 0.04,
    focusCooling: 0.28 + rapid * 0.03,
    overheatRelease: 0.34,
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
    focusPellets: 6 + twin * 2,
    driveSpread: 0.26,
    focusSpread: Math.max(0.07, 0.13 - twin * 0.018),
    pumpTime: Math.max(0.38, 0.58 - rapid * 0.055),
    reloadTime: Math.max(0.95, 1.55 - rapid * 0.13),
    driveDamageScale: 0.36,
    focusDamageScale: 0.24,
  };
}

export function getArcRailProfile(
  state: HeroStrikeState,
  overrides: WeaponProfileOverrides = {},
) {
  const rapid = upgradeLevel(state, "rapid-fire", overrides.rapid);
  const twin = upgradeLevel(state, "twin-shot", overrides.twin);
  return {
    chargeRate: 0.44 + rapid * 0.075,
    minimumCharge: 0.3,
    fullCharge: 0.92,
    sideBeams: twin,
    minimumDamageScale: 0.35,
    maximumDamageScale: 2.5,
  };
}
