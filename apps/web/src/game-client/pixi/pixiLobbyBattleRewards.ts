import type { GameState } from "@discord-random-defense/game";
import { initialBalance } from "@discord-random-defense/game";
import { loadLobbyProgress, saveLobbyProgress } from "../../game-lobby/lobbyProgressStorage";
import {
  applyLobbyProgressReward,
  calculateLobbyProgressReward,
  type LobbyProgressReward,
} from "../../game-lobby/lobbyAccountProgress";

export type PixiLobbyBattleReward = {
  gold: number;
  crystals: number;
  accountExp: number;
  passExp: number;
  accountLevelUps: number;
  passLevelUps: number;
};

export function calculateLobbyBattleReward(state: GameState): Omit<PixiLobbyBattleReward, "accountLevelUps" | "passLevelUps"> {
  const enemyGold = state.defeatedEnemies * 8;
  const waveGold = state.clearedWaves * 50;
  const bossCrystals = state.defeatedBosses * 20;
  const clearBonusCrystals = state.status === "cleared" && state.clearedWaves >= initialBalance.maxWave ? 200 : 0;
  const progressReward: LobbyProgressReward = calculateLobbyProgressReward(state);

  return {
    gold: enemyGold + waveGold,
    crystals: bossCrystals + clearBonusCrystals,
    accountExp: progressReward.accountExp,
    passExp: progressReward.passExp,
  };
}

export function grantLobbyBattleReward(state: GameState): PixiLobbyBattleReward {
  const reward = calculateLobbyBattleReward(state);
  const progress = loadLobbyProgress();
  const accountProgressResult = applyLobbyProgressReward(progress.accountProgress, {
    accountExp: reward.accountExp,
    passExp: reward.passExp,
  });

  saveLobbyProgress({
    ...progress,
    gold: progress.gold + reward.gold,
    crystals: progress.crystals + reward.crystals,
    accountProgress: accountProgressResult.progress,
  });

  return {
    ...reward,
    accountLevelUps: accountProgressResult.accountLevelUps,
    passLevelUps: accountProgressResult.passLevelUps,
  };
}

export function formatLobbyBattleReward(reward: PixiLobbyBattleReward) {
  if (reward.gold <= 0 && reward.crystals <= 0 && reward.accountExp <= 0 && reward.passExp <= 0) return "로비 보상 없음";

  const levelUpText = [
    reward.accountLevelUps > 0 ? `계정 +${reward.accountLevelUps}Lv` : "",
    reward.passLevelUps > 0 ? `패스 +${reward.passLevelUps}Lv` : "",
  ].filter(Boolean).join(" / ");
  const currencyText = reward.crystals <= 0
    ? `+${reward.gold}G`
    : reward.gold <= 0
      ? `+${reward.crystals}보석`
      : `+${reward.gold}G / +${reward.crystals}보석`;
  const expText = `계정EXP +${reward.accountExp} / 패스EXP +${reward.passExp}`;

  return levelUpText ? `${currencyText} · ${expText} · ${levelUpText}` : `${currencyText} · ${expText}`;
}
