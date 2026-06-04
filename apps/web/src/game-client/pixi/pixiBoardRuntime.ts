import type { BoardHero } from "@discord-random-defense/game";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { createUnitGhost as createBoardUnitGhost, type BoardMetrics } from "./pixiBoardView";
import type { GameRefs } from "./pixiGameTypes";

export function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const cell = Math.min(
    (layout.boardWidth - 34 - gap * (cols - 1)) / cols,
    (layout.boardHeight - 32 - gap * (rows - 1)) / rows,
  );

  return {
    cols,
    rows,
    cell,
    gap,
    startX: layout.boardX + (layout.boardWidth - cell * cols - gap * (cols - 1)) / 2,
    startY: layout.boardY + 16,
  };
}

export function getCellCenter(refs: GameRefs, cellIndex: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);
  const row = Math.floor(cellIndex / metrics.cols);
  const col = cellIndex % metrics.cols;

  return {
    x: metrics.startX + col * (metrics.cell + metrics.gap) + metrics.cell / 2,
    y: metrics.startY + row * (metrics.cell + metrics.gap) + metrics.cell * 0.48,
    cell: metrics.cell,
  };
}

export function getCellIndexAtPoint(refs: GameRefs, x: number, y: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const cellX = metrics.startX + col * (metrics.cell + metrics.gap);
      const cellY = metrics.startY + row * (metrics.cell + metrics.gap);

      if (x >= cellX && x <= cellX + metrics.cell && y >= cellY && y <= cellY + metrics.cell) {
        return row * metrics.cols + col;
      }
    }
  }

  return null;
}

export function createUnitGhost(hero: Pick<BoardHero, "grade" | "heroId">, cell: number, alpha = 0.92) {
  return createBoardUnitGhost(hero, cell, alpha);
}
