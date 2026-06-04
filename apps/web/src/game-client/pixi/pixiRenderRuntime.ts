import {
  getBoardCapacity,
  getBoardUnitCount,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  initialBalance,
  isBoardFull,
} from "@discord-random-defense/game";
import type { GameState } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import type { GameRefs } from "./pixiGameTypes";
import { calculatePixiFirepower } from "./pixiCombatRuntime";
import { drawPixiBackgroundView } from "./pixiBackgroundView";
import { getPixiPathPoint } from "./pixiPathRuntime";
import { createPixiHudView, updatePixiHudView } from "./pixiHudView";

export function drawBackground(refs: GameRefs, layout: GameLayout) {
  drawPixiBackgroundView(refs.world, layout, getPixiPathPoint);
}

function isHudBossWave(refs: GameRefs) {
  return refs.state.currentWave % initialBalance.bossWaveInterval === 0;
}

export function drawTopHud(refs: GameRefs, layout: GameLayout) {
  if (!refs.hudView) refs.hudView = createPixiHudView(refs.hud);

  updatePixiHudView(refs.hudView, layout, {
    currentWave: refs.state.currentWave,
    wavePhase: refs.wavePhase,
    countdownSeconds: refs.nextWaveTimer,
    combatSeconds: refs.combatTimer,
    lives: refs.state.lives,
    maxLives: initialBalance.startingLives,
    firepower: calculatePixiFirepower(refs),
    unitCount: getBoardUnitCount(refs.state.board),
    unitCapacity: getBoardCapacity(refs.state.board),
    resources: refs.state.resources,
    luckStones: refs.state.luckStones,
    isBossWave: isHudBossWave(refs),
  });
}


import {
  createPixiControlsView,
  updatePixiControlsView,
} from "./pixiControlsView";

export type PixiControlsRenderOptions = {
  isFinished: (state: GameState) => boolean;
  onSummon: () => void;
  onMythic: () => void;
  onGamble: () => void;
  onUpgrade: () => void;
  onWave: () => void;
};

export function getSummonButtonState(state: GameState, isFinished: (state: GameState) => boolean) {
  const cost = getSummonCost(state.summonCount);
  const boardFull = isBoardFull(state.board);
  const disabled = isFinished(state) || boardFull || state.resources < cost;

  if (state.status === "failed") return { cost, disabled, sub: "게임 오버" };
  if (state.status === "cleared") return { cost, disabled, sub: "클리어" };
  if (boardFull) return { cost, disabled, sub: "보드 가득" };
  if (state.resources < cost) return { cost, disabled, sub: `부족 ${cost}` };

  return { cost, disabled, sub: `${cost}` };
}

export function drawControls(
  refs: GameRefs,
  layout: GameLayout,
  options: PixiControlsRenderOptions,
) {
  if (!refs.controlsView) {
    refs.controlsView = createPixiControlsView(refs.controls, {
      onSummon: options.onSummon,
      onMythic: options.onMythic,
      onGamble: options.onGamble,
      onUpgrade: options.onUpgrade,
      onWave: options.onWave,
    });
  }

  const summonState = getSummonButtonState(refs.state, options.isFinished);
  const upgradeCost = getPowerUpgradeCost(refs.state.powerUpgradeLevel);

  updatePixiControlsView(refs.controlsView, layout, {
    summonLabel: summonState.sub,
    summonDisabled: summonState.disabled || refs.movementLocked,
    mythicReady: getMythicCraftAvailability(refs.state).some((item) => item.canCraft),
    mythicDisabled: options.isFinished(refs.state) || refs.movementLocked,
    gambleDisabled:
      options.isFinished(refs.state) ||
      isBoardFull(refs.state.board) ||
      refs.state.luckStones < 2 ||
      refs.movementLocked,
    upgradeCost,
    upgradeLevel: refs.state.powerUpgradeLevel,
    upgradeDisabled:
      options.isFinished(refs.state) ||
      refs.state.resources < upgradeCost ||
      refs.movementLocked,
    wavePhase: refs.wavePhase,
    aliveEnemyCount: refs.activeEnemies.filter((enemy) => enemy.alive).length,
    waveDisabled: options.isFinished(refs.state) || refs.movementLocked || refs.wavePhase === "combat",
  });
}
