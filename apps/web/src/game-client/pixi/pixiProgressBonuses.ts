import type { BoardHero, GameState } from "@discord-random-defense/game";
import { getRunBoostEffect } from "@discord-random-defense/game";
import { getArtifactEffectAtLevel, getHeroPowerAtLevel } from "../../game-lobby/lobbyData";
import { loadLobbyProgress, type LobbyProgressSnapshot } from "../../game-lobby/lobbyProgressStorage";

export type PixiProgressBonuses = {
  progress: LobbyProgressSnapshot;
  baseAttackMultiplier: number;
  baseEconomyMultiplier: number;
  baseLuckStoneBonusChance: number;
  attackMultiplier: number;
  economyMultiplier: number;
  luckStoneBonusChance: number;
  leakReduction: number;
};

export type PixiHeroMasteryEffect = {
  level: number;
  skillMultiplier: number;
  controlMultiplier: number;
  bonusCoin: number;
};

function sumOwnedArtifactEffect(progress: LobbyProgressSnapshot, categories: string[]) {
  return progress.artifacts.reduce((sum, artifact) => {
    if (!artifact.owned || artifact.level <= 0 || !categories.includes(artifact.category)) return sum;
    return sum + getArtifactEffectAtLevel(artifact, artifact.level);
  }, 0);
}

export function syncPixiProgressBonusesFromState(bonuses: PixiProgressBonuses, state: GameState) {
  const attackBoost = getRunBoostEffect("attack", state.runBoosts?.attack ?? 0);
  const economyBoost = getRunBoostEffect("economy", state.runBoosts?.economy ?? 0);
  const luckBoost = getRunBoostEffect("luck", state.runBoosts?.luck ?? 0);

  bonuses.attackMultiplier = bonuses.baseAttackMultiplier * (1 + attackBoost);
  bonuses.economyMultiplier = bonuses.baseEconomyMultiplier * (1 + economyBoost);
  bonuses.luckStoneBonusChance = Math.min(0.75, bonuses.baseLuckStoneBonusChance + luckBoost);
}

export function createPixiProgressBonuses(): PixiProgressBonuses {
  const progress = loadLobbyProgress();
  const attackBonus = sumOwnedArtifactEffect(progress, ["attack"]);
  const economyBonus = sumOwnedArtifactEffect(progress, ["economy"]);
  const luckBonus = sumOwnedArtifactEffect(progress, ["luck"]);
  const defenseBonus = sumOwnedArtifactEffect(progress, ["defense"]);
  const bonuses: PixiProgressBonuses = {
    progress,
    baseAttackMultiplier: 1 + attackBonus,
    baseEconomyMultiplier: 1 + economyBonus,
    baseLuckStoneBonusChance: Math.min(0.65, luckBonus),
    attackMultiplier: 1 + attackBonus,
    economyMultiplier: 1 + economyBonus,
    luckStoneBonusChance: Math.min(0.65, luckBonus),
    leakReduction: Math.min(0.5, defenseBonus),
  };

  return bonuses;
}

export function getProgressHeroLevel(bonuses: PixiProgressBonuses, heroId: string) {
  const progressHero = bonuses.progress.heroes.find((hero) => hero.id === heroId);
  return progressHero?.owned ? Math.max(1, progressHero.level) : 1;
}

export function getProgressHeroPower(bonuses: PixiProgressBonuses, hero: BoardHero, fallbackPower: number) {
  const progressHero = bonuses.progress.heroes.find((item) => item.id === hero.heroId);
  if (!progressHero?.owned) return fallbackPower;
  return getHeroPowerAtLevel(progressHero, Math.max(1, progressHero.level));
}

export function getProgressHeroMasteryEffect(bonuses: PixiProgressBonuses, heroId: string): PixiHeroMasteryEffect {
  const level = getProgressHeroLevel(bonuses, heroId);
  const masterySteps = Math.max(0, level - 1);

  return {
    level,
    skillMultiplier: 1 + Math.min(0.35, masterySteps * 0.035),
    controlMultiplier: 1 + Math.min(0.28, masterySteps * 0.028),
    bonusCoin: level >= 5 ? 1 + Math.floor((level - 5) / 3) : 0,
  };
}

export function applyEconomyRewardBonus(bonuses: PixiProgressBonuses, reward: number) {
  return Math.max(1, Math.round(reward * bonuses.economyMultiplier));
}

export function applyLeakReduction(bonuses: PixiProgressBonuses, lostLives: number) {
  if (lostLives <= 0) return 0;
  return Math.max(1, Math.ceil(lostLives * (1 - bonuses.leakReduction)));
}

export function getPerfectWaveLuckStoneReward(bonuses: PixiProgressBonuses, baseReward: number, roll: () => number) {
  if (baseReward <= 0) return 0;
  return baseReward + (roll() < bonuses.luckStoneBonusChance ? 1 : 0);
}
