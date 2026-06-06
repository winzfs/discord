import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { WAVE_COMBAT_SECONDS } from "./pixiGameTypes";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { updateEnemyViewPosition } from "./pixiEnemyView";

const EXIT_HOLD_PROGRESS = 0.998;
const EXIT_WAIT_PROGRESS = 0.986;
const EXIT_DAMAGE_INTERVAL_MS = 220;

export type UpdateActiveEnemiesOptions = {
  getPathPoint: (layout: GameLayout, progress: number) => { x: number; y: number };
  invalidateControls: (refs: GameRefs) => void;
  invalidateHud: (refs: GameRefs) => void;
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

function hasExitQueue(refs: GameRefs) {
  return refs.activeEnemies.some((enemy) => enemy.alive && !enemy.leaked && enemy.exitQueued);
}

function setEnemyProgress(layout: GameLayout, enemy: GameRefs["activeEnemies"][number], progress: number, options: UpdateActiveEnemiesOptions) {
  enemy.progress = progress;
  const point = options.getPathPoint(layout, progress);
  enemy.x = point.x;
  enemy.y = point.y;
  updateEnemyViewPosition(enemy.view, point.x, point.y, enemy.progress);
}

function queueEnemyAtExit(layout: GameLayout, enemy: GameRefs["activeEnemies"][number], options: UpdateActiveEnemiesOptions) {
  enemy.exitQueued = true;
  setEnemyProgress(layout, enemy, EXIT_HOLD_PROGRESS, options);
}

function holdEnemyBeforeExit(layout: GameLayout, enemy: GameRefs["activeEnemies"][number], options: UpdateActiveEnemiesOptions) {
  setEnemyProgress(layout, enemy, EXIT_WAIT_PROGRESS, options);
}

function removeEnemyAtExit(refs: GameRefs, enemy: GameRefs["activeEnemies"][number], options: UpdateActiveEnemiesOptions) {
  if (enemy.leaked || !enemy.alive || !enemy.exitQueued) return;

  const nextLives = Math.max(0, refs.state.lives - enemy.damageToLife);
  enemy.leaked = true;
  enemy.alive = false;
  enemy.progress = 1;
  refs.waveLostLives += enemy.damageToLife;
  refs.state = {
    ...refs.state,
    lives: nextLives,
    status: nextLives <= 0 ? "failed" : refs.state.status,
  };
  refs.nextEnemyLeakAt = Date.now() + EXIT_DAMAGE_INTERVAL_MS;
  destroyActiveEnemy(enemy);
  options.invalidateHud(refs);
  options.invalidateControls(refs);
  options.floatText(
    refs,
    `누수 -${enemy.damageToLife}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.35,
    colors.red,
  );
}

function getExitTarget(enemies: GameRefs["activeEnemies"]) {
  return enemies
    .filter((enemy) => enemy.alive && !enemy.leaked && enemy.exitQueued)
    .sort((a, b) => a.id - b.id)[0] ?? null;
}

export function updateActiveEnemies(
  refs: GameRefs,
  deltaSeconds: number,
  options: UpdateActiveEnemiesOptions,
) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const now = Date.now();

  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.leaked) continue;

    if (enemy.exitQueued) continue;

    if (updateControlledEnemyPosition(enemy, now)) continue;

    const nextProgress = enemy.progress + (deltaSeconds * enemy.speed) / WAVE_COMBAT_SECONDS;

    if (nextProgress >= 1) {
      if (hasExitQueue(refs) || now < refs.nextEnemyLeakAt) {
        holdEnemyBeforeExit(layout, enemy, options);
      } else {
        queueEnemyAtExit(layout, enemy, options);
      }
      continue;
    }

    setEnemyProgress(layout, enemy, nextProgress, options);
  }

  if (now < refs.nextEnemyLeakAt) return;

  const exitTarget = getExitTarget(refs.activeEnemies);
  if (exitTarget) removeEnemyAtExit(refs, exitTarget, options);
}
