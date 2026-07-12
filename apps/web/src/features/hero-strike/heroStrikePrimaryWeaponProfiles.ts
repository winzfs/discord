import type { HeroStrikeState } from "./heroStrikeTypes";

function upgradeLevel(state: HeroStrikeState, id: keyof HeroStrikeState["upgradeLevels"]) {
  return state.upgradeLevels[id] ?? 0;
}

export function getPulseRepeaterProfile(state: HeroStrikeState) {
  const rapid = upgradeLevel(state, "rapid-fire");
  const twin = upgradeLevel(state, "twin-shot");
  return {
    driveBurst: 3 + (twin >= 2 ? 1 : 0),
    focusBurst: 5 + twin,
    shotGap: Math.max(0.045, 0.072 - rapid * 0.007),
    driveRecovery: Math.max(0.22, 0.34 - rapid * 0.03),
    focusRecovery: Math.max(0.3, 0.48 - rapid * 0.035),
    heatPerShot: Math.max(0.07, 0.105 - rapid * 0.008),
    driveCooling: 0.34 + rapid * 0.035,
    focusCooling: 0.2 + rapid * 0.025,
    overheatRelease: 0.34,
  };
}

export function getBreacherScatterProfile(state: HeroStrikeState) {
  const rapid = upgradeLevel(state, "rapid-fire");
  const twin = upgradeLevel(state, "twin-shot");
  return {
    magazine: 5,
    drivePellets: 2 + (twin >= 2 ? 1 : 0),
    focusPellets: 6 + twin * 2,
    driveSpread: 0.26,
    focusSpread: Math.max(0.07, 0.13 - twin * 0.018),
    pumpTime: Math.max(0.38, 0.58 - rapid * 0.055),
    reloadTime: Math.max(0.95, 1.55 - rapid * 0.13),
    driveDamageScale: 0.34,
    focusDamageScale: 0.19,
  };
}

export function getArcRailProfile(state: HeroStrikeState) {
  const rapid = upgradeLevel(state, "rapid-fire");
  const twin = upgradeLevel(state, "twin-shot");
  return {
    chargeRate: 0.44 + rapid * 0.075,
    minimumCharge: 0.2,
    fullCharge: 0.92,
    sideBeams: twin,
    minimumDamageScale: 0.95,
    maximumDamageScale: 2.45,
  };
}
