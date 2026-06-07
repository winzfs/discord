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

type ShardTargetResult<T> = {
  items: T[];
  targetName: string | null;
};

function addHeroShards(heroes: LobbyHero[], amount: number, mythicOnly = false): ShardTargetResult<LobbyHero> {
  const candidates = heroes
    .map((hero, index) => ({ hero, index }))
    .filter(({ hero }) => hero.owned && (mythicOnly ? hero.grade === "mythic" : hero.grade !== "mythic"));
  const fallbackCandidates = heroes
    .map((hero, index) => ({ hero, index }))
    .filter(({ hero }) => hero.owned);
  const target = candidates[0] ?? fallbackCandidates[0];

  if (!target) return { items: heroes, targetName: null };

  return {
    items: heroes.map((hero, heroIndex) => heroIndex === target.index ? { ...hero, shards: hero.shards + amount } : hero),
    targetName: target.hero.displayName,
  };
}

function addArtifactPieces(artifacts: LobbyArtifact[], amount: number): ShardTargetResult<LobbyArtifact> {
  const target = artifacts.map((artifact, index) => ({ artifact, index })).find(({ artifact }) => artifact.owned);
  if (!target) return { items: artifacts, targetName: null };

  return {
    items: artifacts.map((artifact, artifactIndex) => artifactIndex === target.index ? { ...artifact, pieces: artifact.pieces + amount } : artifact),
    targetName: target.artifact.displayName,
  };
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
  let rewardDetail = reward.label;

  if (reward.kind === "gold") {
    nextGold += reward.amount;
    rewardDetail = `골드 ${reward.amount}`;
  } else if (reward.kind === "crystals") {
    nextCrystals += reward.amount;
    rewardDetail = `보석 ${reward.amount}`;
  } else if (reward.kind === "hero-shards") {
    const result = addHeroShards(progress.heroes, reward.amount);
    nextHeroes = result.items;
    rewardDetail = result.targetName ? `${result.targetName} 조각 ${reward.amount}개` : `영웅 조각 ${reward.amount}개`;
  } else if (reward.kind === "mythic-shards") {
    const result = addHeroShards(progress.heroes, reward.amount, true);
    nextHeroes = result.items;
    rewardDetail = result.targetName ? `${result.targetName} 신화 조각 ${reward.amount}개` : `신화 조각 ${reward.amount}개`;
  } else if (reward.kind === "artifact-pieces") {
    const result = addArtifactPieces(progress.artifacts, reward.amount);
    nextArtifacts = result.items;
    rewardDetail = result.targetName ? `${result.targetName} 조각 ${reward.amount}개` : `유물 조각 ${reward.amount}개`;
  }

  return {
    gold: nextGold,
    crystals: nextCrystals,
    heroes: nextHeroes,
    artifacts: nextArtifacts,
    accountProgress: markPassRewardClaimed(progress.accountProgress, reward.level),
    message: `패스 Lv.${reward.level} 보상 수령: ${rewardDetail}`,
  };
}
