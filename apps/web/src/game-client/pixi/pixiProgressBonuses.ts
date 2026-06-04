import type { BoardHero } from "@discord-random-defense/game";
import { getArtifactEffectAtLevel, getHeroPowerAtLevel } from "../../game-lobby/lobbyData";
import { loadLobbyProgress, type LobbyProgressSnapshot } from "../../game-lobby/lobbyProgressStorage";

export type PixiProgressBonuses = {
  progress: LobbyProgressSnapshot;
  attackMultiplier: number;
  economyMultiplier: number;
  luckStoneBonusChance: number;
  leakReduction: number;
};

function sumOwnedArtifactEffect(progress: LobbyProgressSnapshot, categories: string[]) {
  return progress.artifacts.reduce((sum, artifact) => {
    if (!artifact.owned || artifact.level <= 0 || !categories.includes(artifact.category)) return sum;
    return sum + getArtifactEffectAtLevel(artifact, artifact.level);
  }, 0);
}

export function createPixiProgressBonuses(): PixiProgressBonuses {
  const progress = loadLobbyProgress();
  const attackBonus = sumOwnedArtifactEffect(progress, ["attack"]);
  const economyBonus = sumOwnedArtifactEffect(progress, ["economy"]);
  const luckBonus = sumOwnedArtifactEffect(progress, ["luck"]);
  const defenseBonus = sumOwnedArtifactEffect(progress, ["defense"]);

  return {
    progress,
    attackMultiplier: 1 + attackBonus,
    economyMultiplier: 1 + economyBonus,
    luckStoneBonusChance: Math.min(0.65, luckBonus),
    leakReduction: Math.min(0.5, defenseBonus),
  };
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
