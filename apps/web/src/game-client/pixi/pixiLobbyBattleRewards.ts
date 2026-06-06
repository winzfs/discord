import type { GameState } from "@discord-random-defense/game";
import { initialBalance } from "@discord-random-defense/game";
import { loadLobbyProgress, saveLobbyProgress } from "../../game-lobby/lobbyProgressStorage";

export type PixiLobbyBattleReward = {
  gold: number;
  crystals: number;
};

export function calculateLobbyBattleReward(state: GameState): PixiLobbyBattleReward {
  const enemyGold = state.defeatedEnemies * 8;
  const waveGold = state.clearedWaves * 50;
  const bossCrystals = state.defeatedBosses * 20;
  const clearBonusCrystals = state.status === "cleared" && state.clearedWaves >= initialBalance.maxWave ? 200 : 0;

  return {
    gold: enemyGold + waveGold,
    crystals: bossCrystals + clearBonusCrystals,
  };
}

export function grantLobbyBattleReward(state: GameState): PixiLobbyBattleReward {
  const reward = calculateLobbyBattleReward(state);
  const progress = loadLobbyProgress();

  saveLobbyProgress({
    ...progress,
    gold: progress.gold + reward.gold,
    crystals: progress.crystals + reward.crystals,
  });

  return reward;
}

export function formatLobbyBattleReward(reward: PixiLobbyBattleReward) {
  if (reward.gold <= 0 && reward.crystals <= 0) return "로비 보상 없음";
  if (reward.crystals <= 0) return `로비 골드 +${reward.gold}`;
  if (reward.gold <= 0) return `로비 보석 +${reward.crystals}`;
  return `로비 보상 +${reward.gold}G / +${reward.crystals}보석`;
}
