import {
  getBoardCapacity,
  getBoardUnitCount,
  initialBalance,
} from "@discord-random-defense/game";
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
