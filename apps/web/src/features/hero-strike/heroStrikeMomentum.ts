import type { HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeMomentumTier = 0 | 1 | 2 | 3 | 4;

export type HeroStrikeMomentumSnapshot = {
  tier: HeroStrikeMomentumTier;
  label: string;
  combo: number;
  nextCombo: number | null;
  ratio: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  movementMultiplier: number;
  accent: string;
};

const THRESHOLDS = [0, 8, 18, 32, 50] as const;

function tierFromCombo(combo: number): HeroStrikeMomentumTier {
  if (combo >= THRESHOLDS[4]) return 4;
  if (combo >= THRESHOLDS[3]) return 3;
  if (combo >= THRESHOLDS[2]) return 2;
  if (combo >= THRESHOLDS[1]) return 1;
  return 0;
}

function presentation(tier: HeroStrikeMomentumTier) {
  if (tier === 4) return {
    label: "APEX",
    damageMultiplier: 1.2,
    fireRateMultiplier: 0.86,
    movementMultiplier: 1.12,
    accent: "#ffd166",
  };
  if (tier === 3) return {
    label: "ONSLAUGHT",
    damageMultiplier: 1.13,
    fireRateMultiplier: 0.9,
    movementMultiplier: 1.08,
    accent: "#ff9b3d",
  };
  if (tier === 2) return {
    label: "CHAIN",
    damageMultiplier: 1.08,
    fireRateMultiplier: 0.94,
    movementMultiplier: 1.05,
    accent: "#bb86fc",
  };
  if (tier === 1) return {
    label: "LINK",
    damageMultiplier: 1.04,
    fireRateMultiplier: 0.97,
    movementMultiplier: 1.02,
    accent: "#69e7ff",
  };
  return {
    label: "READY",
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    movementMultiplier: 1,
    accent: "#8da4c5",
  };
}

export function getHeroStrikeMomentumLabelForCombo(combo: number) {
  const tier = tierFromCombo(combo);
  return { tier, ...presentation(tier) };
}

export function getHeroStrikeMomentumSnapshot(state: HeroStrikeState): HeroStrikeMomentumSnapshot {
  const combo = state.player.combo;
  const tier = tierFromCombo(combo);
  const currentThreshold = THRESHOLDS[tier];
  const nextCombo = tier >= 4 ? null : THRESHOLDS[tier + 1];
  const ratio = nextCombo === null
    ? 1
    : Math.max(0, Math.min(1, (combo - currentThreshold) / Math.max(1, nextCombo - currentThreshold)));
  return {
    tier,
    combo,
    nextCombo,
    ratio,
    ...presentation(tier),
  };
}

export function getHeroStrikeMomentumDamageMultiplier(state: HeroStrikeState) {
  return getHeroStrikeMomentumSnapshot(state).damageMultiplier;
}

export function getHeroStrikeMomentumFireRateMultiplier(state: HeroStrikeState) {
  return getHeroStrikeMomentumSnapshot(state).fireRateMultiplier;
}

export function getHeroStrikeMomentumMovementMultiplier(state: HeroStrikeState) {
  return getHeroStrikeMomentumSnapshot(state).movementMultiplier;
}
