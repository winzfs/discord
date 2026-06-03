import { getEnemyById } from "../data/enemies";
import { initialBalance } from "../data/balance";
import { getWaveByNumber } from "../data/waves";
import { calculateScore } from "../rules/scoring";
import { resolveWaveCombat } from "./combatSystem";
import type { GameState } from "../types/gameState";
import type { WaveDefinition } from "../types/wave";

export type WaveClearInput = {
  leakedEnemies?: Array<{
    enemyId: string;
    count: number;
  }>;
};

export type WaveProgressResult = {
  state: GameState;
  wave: WaveDefinition | null;
  defeatedEnemies: number;
  defeatedBosses: number;
  lostLives: number;
  reward: number;
  boardPower: number;
  waveThreat: number;
  powerRatio: number;
  leakedEnemies: NonNullable<WaveClearInput["leakedEnemies"]>;
  reason?: "missing_wave" | "already_finished";
};

function countWaveEnemies(wave: WaveDefinition): number {
  return wave.enemyGroups.reduce((sum, group) => sum + group.count, 0);
}

function countWaveBosses(wave: WaveDefinition): number {
  return wave.enemyGroups.reduce((sum, group) => {
    const enemy = getEnemyById(group.enemyId);
    return enemy?.type === "boss" ? sum + group.count : sum;
  }, 0);
}

function calculateLostLives(input: WaveClearInput): number {
  return (input.leakedEnemies ?? []).reduce((sum, leakedEnemy) => {
    const enemy = getEnemyById(leakedEnemy.enemyId);
    return sum + (enemy?.damageToLife ?? 1) * leakedEnemy.count;
  }, 0);
}

export function startWave(state: GameState): GameState {
  if (state.status === "cleared" || state.status === "failed") return state;
  return { ...state, status: "playing" };
}

export function completeCurrentWave(state: GameState, input?: WaveClearInput): WaveProgressResult {
  if (state.status === "cleared" || state.status === "failed") {
    return {
      state,
      wave: null,
      defeatedEnemies: 0,
      defeatedBosses: 0,
      lostLives: 0,
      reward: 0,
      boardPower: 0,
      waveThreat: 0,
      powerRatio: 0,
      leakedEnemies: [],
      reason: "already_finished",
    };
  }

  const wave = getWaveByNumber(state.currentWave);
  if (!wave) {
    return {
      state,
      wave: null,
      defeatedEnemies: 0,
      defeatedBosses: 0,
      lostLives: 0,
      reward: 0,
      boardPower: 0,
      waveThreat: 0,
      powerRatio: 0,
      leakedEnemies: [],
      reason: "missing_wave",
    };
  }

  const combat = resolveWaveCombat(state, state.currentWave);
  const resolvedInput: WaveClearInput = input ?? { leakedEnemies: combat.leakedEnemies };
  const leakedEnemies = resolvedInput.leakedEnemies ?? [];
  const totalEnemies = countWaveEnemies(wave);
  const totalBosses = countWaveBosses(wave);
  const leakedCount = leakedEnemies.reduce((sum, leakedEnemy) => sum + leakedEnemy.count, 0);
  const defeatedEnemies = Math.max(0, totalEnemies - leakedCount);
  const defeatedBosses = leakedEnemies.some((leakedEnemy) => getEnemyById(leakedEnemy.enemyId)?.type === "boss") ? 0 : totalBosses;
  const lostLives = calculateLostLives(resolvedInput);
  const nextLives = Math.max(0, state.lives - lostLives);
  const clearedWaves = nextLives > 0 ? state.clearedWaves + 1 : state.clearedWaves;
  const isFinalWave = wave.waveNumber >= initialBalance.maxWave;
  const nextStatus = nextLives <= 0 ? "failed" : isFinalWave ? "cleared" : "playing";
  const nextWave = nextStatus === "playing" ? state.currentWave + 1 : state.currentWave;

  const score = calculateScore({
    reachedWave: nextWave,
    clearedWaves,
    defeatedEnemies: state.defeatedEnemies + defeatedEnemies,
    defeatedBosses: state.defeatedBosses + defeatedBosses,
    remainingLives: nextLives,
    survived: nextStatus === "cleared",
  });

  const reward = lostLives > 0 ? Math.ceil(wave.rewardOnClear * 0.65) : wave.rewardOnClear;

  const nextState: GameState = {
    ...state,
    resources: state.resources + reward,
    lives: nextLives,
    currentWave: nextWave,
    defeatedEnemies: state.defeatedEnemies + defeatedEnemies,
    defeatedBosses: state.defeatedBosses + defeatedBosses,
    clearedWaves,
    score,
    status: nextStatus,
  };

  return {
    state: nextState,
    wave,
    defeatedEnemies,
    defeatedBosses,
    lostLives,
    reward,
    boardPower: combat.boardPower.totalPower,
    waveThreat: combat.waveThreat.totalThreat,
    powerRatio: combat.powerRatio,
    leakedEnemies,
  };
}

export function advanceWave(state: GameState): GameState {
  return completeCurrentWave(state).state;
}
