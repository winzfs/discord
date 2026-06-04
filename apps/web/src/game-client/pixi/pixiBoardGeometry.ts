import type { BoardSize } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import type { BoardMetrics } from "./pixiBoardView";

export type PixiCellCenter = {
  x: number;
  y: number;
  cell: number;
};

export function getPixiBoardMetrics(layout: GameLayout, boardSize: BoardSize): BoardMetrics {
  const gap = 7;
  const cols = boardSize.columns;
  const rows = boardSize.rows;
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

export function getPixiCellCenter(metrics: BoardMetrics, cellIndex: number): PixiCellCenter {
  const row = Math.floor(cellIndex / metrics.cols);
  const col = cellIndex % metrics.cols;

  return {
    x: metrics.startX + col * (metrics.cell + metrics.gap) + metrics.cell / 2,
    y: metrics.startY + row * (metrics.cell + metrics.gap) + metrics.cell * 0.48,
    cell: metrics.cell,
  };
}

export function getPixiCellIndexAtPoint(metrics: BoardMetrics, x: number, y: number) {
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
