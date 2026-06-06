import { initialBalance, startWave } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import {
  WAVE_COMBAT_SECONDS,
  WAVE_COUNTDOWN_SECONDS,
  WAVE_RESULT_SECONDS,
} from "./pixiGameTypes";
import { applyLeakReduction, getPerfectWaveLuckStoneReward } from "./pixiProgressBonuses";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
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
  refs.state = startWave(refs.state);

  options.render(refs);
  spawnWaveMonsters(refs, {
    showBossWarning: options.showBossWarning,
    invalidateControls: options.invalidateControls,
  });
}

export function finishAutoWave(
  refs: GameRefs,
  readyImmediately = false,
  options: PixiWaveFlowRuntimeOptions,
) {
  const alive = refs.activeEnemies.filter((enemy) => enemy.alive);
  let lostLives = refs.waveLostLives;

  for (const enemy of alive) {
    lostLives += enemy.damageToLife;
    enemy.alive = false;
    destroyActiveEnemy(enemy);
  }

  const leaked = alive.length + refs.waveLostLives;
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
  const reducedLostLives = applyLeakReduction(refs.progressBonuses, lostLives);
  const nextLives = Math.max(0, refs.state.lives - reducedLostLives);
  const finalWave = refs.state.currentWave >= initialBalance.maxWave;
  const nextStatus = nextLives <= 0 ? "failed" : finalWave ? "cleared" : "playing";
  const nextWave = nextStatus === "playing" ? refs.state.currentWave + 1 : refs.state.currentWave;

  refs.activeEnemies = [];
  refs.lastWaveSummary = {
    killed: refs.waveKilled,
    leaked,
    lostLives: reducedLostLives,
    reward: refs.waveReward,
    luckStoneReward,
    perfect,
  };
  refs.state = {
    ...refs.state,
    lives: nextLives,
    luckStones: refs.state.luckStones + luckStoneReward,
    currentWave: nextWave,
    clearedWaves: refs.state.clearedWaves + (nextLives > 0 ? 1 : 0),
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
