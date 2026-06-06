import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import type { GameRefs } from "./pixiGameTypes";
import { WAVE_COMBAT_SECONDS } from "./pixiGameTypes";
import { updateEnemyViewPosition } from "./pixiEnemyView";
import {
  getEnemyControlSpeedMultiplier,
  updateControlZones,
  updateEnemyControlVisual,
} from "./pixiControlEffectRuntime";

export type UpdateActiveEnemiesOptions = {
  getPathPoint: (layout: GameLayout, progress: number) => { x: number; y: number };
};

function updateControlledEnemyPosition(enemy: GameRefs["activeEnemies"][number], now: number) {
  if (enemy.controlUntil && enemy.controlUntil > now && enemy.controlX !== undefined && enemy.controlY !== undefined) {
    enemy.x = enemy.controlX;
    enemy.y = enemy.controlY;
    updateEnemyViewPosition(enemy.view, enemy.x, enemy.y, enemy.progress);
    return true;
  }

  if (enemy.sleepUntil && enemy.sleepUntil > now) {
    updateEnemyViewPosition(enemy.view, enemy.x, enemy.y, enemy.progress);
    return true;
  }

  return false;
}

function normalizeLoopProgress(progress: number) {
  if (progress < 0) return progress;
  return progress % 1;
}

export function updateActiveEnemies(
  refs: GameRefs,
  deltaSeconds: number,
  options: UpdateActiveEnemiesOptions,
) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const now = Date.now();

  updateControlZones(refs, now);

  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive) continue;
    updateEnemyControlVisual(enemy, now);
    if (updateControlledEnemyPosition(enemy, now)) continue;

    const controlSpeedMultiplier = getEnemyControlSpeedMultiplier(enemy, now);
    enemy.progress = normalizeLoopProgress(enemy.progress + (deltaSeconds * enemy.speed * controlSpeedMultiplier) / WAVE_COMBAT_SECONDS);
    const point = options.getPathPoint(layout, enemy.progress);
    enemy.x = point.x;
    enemy.y = point.y;
    updateEnemyViewPosition(enemy.view, point.x, point.y, enemy.progress);
  }
}
