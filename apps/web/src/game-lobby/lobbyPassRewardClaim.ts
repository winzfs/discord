import type { LobbyArtifact, LobbyHero } from "./lobbyData";
import {
  canClaimPassReward,
  markPassRewardClaimed,
  type LobbyAccountProgress,
  type LobbyPassReward,
} from "./lobbyAccountProgress";

export type LobbyPassRewardClaimResult = {
  gold: number;
  crystals: number;
  heroes: LobbyHero[];
  artifacts: LobbyArtifact[];
  accountProgress: LobbyAccountProgress;
  message: string;
};

function addHeroShards(heroes: LobbyHero[], amount: number) {
  const targetIndex = heroes.findIndex((hero) => hero.owned && hero.grade !== "mythic");
  const fallbackIndex = heroes.findIndex((hero) => hero.owned);
  const index = targetIndex >= 0 ? targetIndex : fallbackIndex;
  if (index < 0) return heroes;

  return heroes.map((hero, heroIndex) => heroIndex === index ? { ...hero, shards: hero.shards + amount } : hero);
}

function addArtifactPieces(artifacts: LobbyArtifact[], amount: number) {
  const targetIndex = artifacts.findIndex((artifact) => artifact.owned);
  if (targetIndex < 0) return artifacts;

  return artifacts.map((artifact, artifactIndex) => artifactIndex === targetIndex ? { ...artifact, pieces: artifact.pieces + amount } : artifact);
}

export function claimLobbyPassReward(
  reward: LobbyPassReward,
  progress: {
    gold: number;
    crystals: number;
    heroes: LobbyHero[];
    artifacts: LobbyArtifact[];
    accountProgress: LobbyAccountProgress;
  },
): LobbyPassRewardClaimResult | null {
  if (!canClaimPassReward(progress.accountProgress, reward)) return null;

  let nextGold = progress.gold;
  let nextCrystals = progress.crystals;
  let nextHeroes = progress.heroes;
  let nextArtifacts = progress.artifacts;

  if (reward.kind === "gold") {
    nextGold += reward.amount;
  } else if (reward.kind === "crystals") {
    nextCrystals += reward.amount;
  } else if (reward.kind === "hero-shards") {
    nextHeroes = addHeroShards(progress.heroes, reward.amount);
  } else if (reward.kind === "artifact-pieces") {
    nextArtifacts = addArtifactPieces(progress.artifacts, reward.amount);
  }

  return {
    gold: nextGold,
    crystals: nextCrystals,
    heroes: nextHeroes,
    artifacts: nextArtifacts,
    accountProgress: markPassRewardClaimed(progress.accountProgress, reward.level),
    message: `패스 Lv.${reward.level} 보상 수령: ${reward.label}`,
  };
}
