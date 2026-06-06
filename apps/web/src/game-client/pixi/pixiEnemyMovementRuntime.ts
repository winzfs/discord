import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { WAVE_COMBAT_SECONDS } from "./pixiGameTypes";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { updateEnemyViewPosition } from "./pixiEnemyView";

const EXIT_HOLD_PROGRESS = 0.998;

export type UpdateActiveEnemiesOptions = {
  getPathPoint: (layout: GameLayout, progress: number) => { x: number; y: number };
  invalidateControls: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
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

function leakEnemy(refs: GameRefs, enemy: GameRefs["activeEnemies"][number], options: UpdateActiveEnemiesOptions) {
  if (enemy.leaked || !enemy.alive) return;

  enemy.leaked = true;
  enemy.alive = false;
  enemy.progress = 1;
  refs.waveLostLives += enemy.damageToLife;
  destroyActiveEnemy(enemy);
  options.invalidateControls(refs);
  options.floatText(
    refs,
    `누수 -${enemy.damageToLife}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.35,
    colors.red,
  );
}

function holdEnemyAtExit(layout: GameLayout, enemy: GameRefs["activeEnemies"][number], options: UpdateActiveEnemiesOptions) {
  enemy.progress = EXIT_HOLD_PROGRESS;
  const point = options.getPathPoint(layout, enemy.progress);
  enemy.x = point.x;
  enemy.y = point.y;
  updateEnemyViewPosition(enemy.view, point.x, point.y, enemy.progress);
}

export function updateActiveEnemies(
  refs: GameRefs,
  deltaSeconds: number,
  options: UpdateActiveEnemiesOptions,
) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const now = Date.now();
  let leakedThisFrame = false;

  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.leaked) continue;

    if (updateControlledEnemyPosition(enemy, now)) continue;

    enemy.progress += (deltaSeconds * enemy.speed) / WAVE_COMBAT_SECONDS;

    if (enemy.progress >= 1) {
      if (leakedThisFrame) {
        holdEnemyAtExit(layout, enemy, options);
        continue;
      }

      leakedThisFrame = true;
      leakEnemy(refs, enemy, options);
      continue;
    }

    const point = options.getPathPoint(layout, enemy.progress);
    enemy.x = point.x;
    enemy.y = point.y;
    updateEnemyViewPosition(enemy.view, point.x, point.y, enemy.progress);
  }
}
