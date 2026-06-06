import type { GameState } from "@discord-random-defense/game";

export type LobbyPassRewardKind = "gold" | "crystals" | "hero-shards" | "artifact-pieces";

export type LobbyPassReward = {
  level: number;
  kind: LobbyPassRewardKind;
  amount: number;
  label: string;
  featured?: boolean;
};

export type LobbyAccountProgress = {
  accountLevel: number;
  accountExp: number;
  passLevel: number;
  passExp: number;
  passSeasonId: string;
  claimedPassRewardLevels: number[];
};

export type LobbyProgressReward = {
  accountExp: number;
  passExp: number;
};

export type LobbyProgressApplyResult = {
  progress: LobbyAccountProgress;
  accountLevelUps: number;
  passLevelUps: number;
};

export const defaultLobbyAccountProgress: LobbyAccountProgress = {
  accountLevel: 1,
  accountExp: 0,
  passLevel: 1,
  passExp: 0,
  passSeasonId: "season-1",
  claimedPassRewardLevels: [],
};

export const lobbyPassRewards: LobbyPassReward[] = [
  { level: 1, kind: "gold", amount: 500, label: "골드 500" },
  { level: 2, kind: "crystals", amount: 80, label: "보석 80" },
  { level: 3, kind: "hero-shards", amount: 12, label: "영웅 조각 12" },
  { level: 4, kind: "gold", amount: 900, label: "골드 900" },
  { level: 5, kind: "artifact-pieces", amount: 8, label: "유물 조각 8", featured: true },
  { level: 6, kind: "crystals", amount: 120, label: "보석 120" },
  { level: 7, kind: "hero-shards", amount: 18, label: "영웅 조각 18" },
  { level: 8, kind: "gold", amount: 1400, label: "골드 1400" },
  { level: 9, kind: "crystals", amount: 160, label: "보석 160" },
  { level: 10, kind: "hero-shards", amount: 30, label: "신화 조각 상자", featured: true },
];

const ACCOUNT_MAX_LEVEL = 100;
const PASS_MAX_LEVEL = 50;

export function getAccountExpRequirement(level: number) {
  return 120 + Math.max(0, level - 1) * 35;
}

export function getPassExpRequirement(level: number) {
  return 100;
}

function normalizeLevel(value: unknown, fallback: number, maxLevel: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(maxLevel, Math.floor(value)));
}

function normalizeExp(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function normalizeClaimedLevels(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((level): level is number => typeof level === "number" && Number.isFinite(level))
    .map((level) => Math.floor(level))
    .filter((level, index, levels) => level > 0 && levels.indexOf(level) === index)
    .sort((a, b) => a - b);
}

export function mergeLobbyAccountProgress(value: Partial<LobbyAccountProgress> | undefined): LobbyAccountProgress {
  return {
    accountLevel: normalizeLevel(value?.accountLevel, defaultLobbyAccountProgress.accountLevel, ACCOUNT_MAX_LEVEL),
    accountExp: normalizeExp(value?.accountExp),
    passLevel: normalizeLevel(value?.passLevel, defaultLobbyAccountProgress.passLevel, PASS_MAX_LEVEL),
    passExp: normalizeExp(value?.passExp),
    passSeasonId: typeof value?.passSeasonId === "string" ? value.passSeasonId : defaultLobbyAccountProgress.passSeasonId,
    claimedPassRewardLevels: normalizeClaimedLevels(value?.claimedPassRewardLevels),
  };
}

export function isPassRewardClaimed(progress: LobbyAccountProgress, level: number) {
  return progress.claimedPassRewardLevels.includes(level);
}

export function canClaimPassReward(progress: LobbyAccountProgress, reward: LobbyPassReward) {
  return progress.passLevel >= reward.level && !isPassRewardClaimed(progress, reward.level);
}

export function markPassRewardClaimed(progress: LobbyAccountProgress, level: number): LobbyAccountProgress {
  if (isPassRewardClaimed(progress, level)) return progress;

  return {
    ...progress,
    claimedPassRewardLevels: [...progress.claimedPassRewardLevels, level].sort((a, b) => a - b),
  };
}

export function calculateLobbyProgressReward(state: GameState): LobbyProgressReward {
  const waveExp = state.clearedWaves * 18;
  const killExp = Math.floor(state.defeatedEnemies * 1.6);
  const bossExp = state.defeatedBosses * 40;
  const clearBonus = state.status === "cleared" ? 250 : 0;
  const accountExp = Math.max(20, waveExp + killExp + bossExp + clearBonus);

  return {
    accountExp,
    passExp: Math.round(accountExp * 0.72 + state.defeatedBosses * 20),
  };
}

function applyExpLevels(level: number, exp: number, gainedExp: number, maxLevel: number, getRequirement: (level: number) => number) {
  let nextLevel = level;
  let nextExp = exp + gainedExp;
  let levelUps = 0;

  while (nextLevel < maxLevel) {
    const required = getRequirement(nextLevel);
    if (nextExp < required) break;
    nextExp -= required;
    nextLevel += 1;
    levelUps += 1;
  }

  if (nextLevel >= maxLevel) {
    nextLevel = maxLevel;
    nextExp = Math.min(nextExp, getRequirement(maxLevel));
  }

  return { level: nextLevel, exp: nextExp, levelUps };
}

export function applyLobbyProgressReward(progress: LobbyAccountProgress, reward: LobbyProgressReward): LobbyProgressApplyResult {
  const account = applyExpLevels(
    progress.accountLevel,
    progress.accountExp,
    reward.accountExp,
    ACCOUNT_MAX_LEVEL,
    getAccountExpRequirement,
  );
  const pass = applyExpLevels(
    progress.passLevel,
    progress.passExp,
    reward.passExp,
    PASS_MAX_LEVEL,
    getPassExpRequirement,
  );

  return {
    progress: {
      ...progress,
      accountLevel: account.level,
      accountExp: account.exp,
      passLevel: pass.level,
      passExp: pass.exp,
    },
    accountLevelUps: account.levelUps,
    passLevelUps: pass.levelUps,
  };
}

export function getAccountProgressPercent(progress: LobbyAccountProgress) {
  return Math.min(100, Math.round((progress.accountExp / getAccountExpRequirement(progress.accountLevel)) * 100));
}

export function getPassProgressPercent(progress: LobbyAccountProgress) {
  return Math.min(100, Math.round((progress.passExp / getPassExpRequirement(progress.passLevel)) * 100));
}
