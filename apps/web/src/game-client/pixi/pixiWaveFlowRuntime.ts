import { initialBalance, startWave } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import {
  WAVE_COMBAT_SECONDS,
  WAVE_COUNTDOWN_SECONDS,
  WAVE_RESULT_SECONDS,
} from "./pixiGameTypes";
import { getPerfectWaveLuckStoneReward } from "./pixiProgressBonuses";
import { spawnWaveMonsters } from "./pixiWaveRuntime";
import { showWaveRewardMenu } from "./pixiWaveRewardRuntime";
import { showFinalResultPanel } from "./pixiFinalResultView";

export type PixiWaveFlowRuntimeOptions = {
  isFinished: (state: GameRefs["state"]) => boolean;
  isBossWave: (state: GameRefs["state"]) => boolean;
  clearMenu: (refs: GameRefs) => void;
  clearMenuAndUnitInfo: (refs: GameRefs) => void;
  render: (refs: GameRefs) => void;
  showWaveResult: (refs: GameRefs) => void;
  submitFinalResultOnce: (refs: GameRefs) => void;
  showBossWarning: (refs: GameRefs) => void;
  invalidateControls: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

function spawnCurrentWave(refs: GameRefs, options: PixiWaveFlowRuntimeOptions) {
  spawnWaveMonsters(refs, {
    showBossWarning: options.showBossWarning,
    invalidateControls: options.invalidateControls,
  });
}

export function waveButtonAction(refs: GameRefs, options: PixiWaveFlowRuntimeOptions) {
  if (refs.wavePhase === "combat") return;

  refs.nextWaveTimer = 0;
  startAutoWave(refs, options);
}

export function startAutoWave(refs: GameRefs, options: PixiWaveFlowRuntimeOptions) {
  if (options.isFinished(refs.state) || refs.wavePhase === "combat") return;

  options.clearMenuAndUnitInfo(refs);
  refs.wavePhase = "combat";
  refs.combatTimer = WAVE_COMBAT_SECONDS;
  refs.attackTimer = 0.25;
  refs.waveKilled = 0;
  refs.waveReward = 0;
  refs.waveLostLives = 0;
  refs.state = startWave(refs.state);

  options.render(refs);
  spawnCurrentWave(refs, options);
}

export function startNextTimedWave(refs: GameRefs, options: PixiWaveFlowRuntimeOptions) {
  if (options.isFinished(refs.state)) return;
  if (refs.state.currentWave >= initialBalance.maxWave) return;

  refs.state = {
    ...refs.state,
    currentWave: refs.state.currentWave + 1,
    clearedWaves: refs.state.clearedWaves + 1,
    status: "playing",
  };
  refs.combatTimer = WAVE_COMBAT_SECONDS;
  refs.attackTimer = Math.min(refs.attackTimer, 0.25);
  spawnCurrentWave(refs, options);
  options.render(refs);
}

export function finishAutoWave(
  refs: GameRefs,
  readyImmediately = false,
  options: PixiWaveFlowRuntimeOptions,
) {
  const unresolvedEnemies = refs.activeEnemies.filter((enemy) => enemy.alive && !enemy.leaked);
  if (unresolvedEnemies.length > 0) return;

  const leakedEnemies = refs.activeEnemies.filter((enemy) => enemy.leaked).length;
  const lostLives = refs.waveLostLives;
  const perfect = lostLives <= 0;
  const baseLuckStoneReward = perfect
    ? options.isBossWave(refs.state)
      ? 2
      : refs.state.currentWave % 3 === 0
        ? 1
        : 0
    : 0;
  const luckStoneReward = getPerfectWaveLuckStoneReward(
    refs.progressBonuses,
    baseLuckStoneReward,
    refs.random,
  );
  const finalWave = refs.state.currentWave >= initialBalance.maxWave;
  const nextStatus = refs.state.lives <= 0 ? "failed" : finalWave ? "cleared" : "playing";

  refs.activeEnemies = [];
  refs.lastWaveSummary = {
    killed: refs.waveKilled,
    leaked: leakedEnemies,
    lostLives,
    reward: refs.waveReward,
    luckStoneReward,
    perfect,
  };
  refs.state = {
    ...refs.state,
    luckStones: refs.state.luckStones + luckStoneReward,
    status: nextStatus,
    score: refs.state.score + refs.waveKilled * 10 + (perfect ? 50 : 0),
  };
  refs.wavePhase = "result";
  refs.resultTimer = readyImmediately ? 0.35 : WAVE_RESULT_SECONDS;
  refs.nextWaveTimer = readyImmediately ? 0 : WAVE_COUNTDOWN_SECONDS;

  options.render(refs);
  options.showWaveResult(refs);
  if (refs.state.status === "playing") {
    showWaveRewardMenu(refs, {
      clearMenu: options.clearMenu,
      render: options.render,
      floatText: options.floatText,
    });
  } else {
    showFinalResultPanel(refs);
  }
  options.submitFinalResultOnce(refs);
}
