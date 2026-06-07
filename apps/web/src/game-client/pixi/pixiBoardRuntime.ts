import type { BoardHero } from "@discord-random-defense/game";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { createUnitGhost as createBoardUnitGhost, type BoardMetrics } from "./pixiBoardView";
import type { GameRefs } from "./pixiGameTypes";

const BOARD_CELL_TOP_PADDING = 11;
const BOARD_CELL_HEIGHT_SCALE = 1.08;
const NEAREST_DROP_PADDING_MULTIPLIER = 1.15;

export function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const maxCellWidth = (layout.boardWidth - 34 - gap * (cols - 1)) / cols;
  const maxCellHeight = (layout.boardHeight - 32 - gap * (rows - 1)) / rows;
  const cellWidth = Math.min(maxCellWidth, maxCellHeight);
  const cellHeight = Math.min(cellWidth * BOARD_CELL_HEIGHT_SCALE, maxCellHeight);

  return {
    cols,
    rows,
    cell: cellWidth,
    cellWidth,
    cellHeight,
    gap,
    startX: layout.boardX + (layout.boardWidth - cellWidth * cols - gap * (cols - 1)) / 2,
    startY: layout.boardY + BOARD_CELL_TOP_PADDING,
  };
}

export function getCellCenter(refs: GameRefs, cellIndex: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);
  const row = Math.floor(cellIndex / metrics.cols);
  const col = cellIndex % metrics.cols;

  return {
    x: metrics.startX + col * (metrics.cellWidth + metrics.gap) + metrics.cellWidth / 2,
    y: metrics.startY + row * (metrics.cellHeight + metrics.gap) + metrics.cellHeight * 0.48,
    cell: metrics.cell,
  };
}

export function getCellIndexAtPoint(refs: GameRefs, x: number, y: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const cellX = metrics.startX + col * (metrics.cellWidth + metrics.gap);
      const cellY = metrics.startY + row * (metrics.cellHeight + metrics.gap);

      if (x >= cellX && x <= cellX + metrics.cellWidth && y >= cellY && y <= cellY + metrics.cellHeight) {
        return row * metrics.cols + col;
      }
    }
  }

  return null;
}

export function getNearestCellIndexForDrop(refs: GameRefs, x: number, y: number) {
  const directIndex = getCellIndexAtPoint(refs, x, y);
  if (directIndex !== null) return directIndex;

  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);
  const left = metrics.startX;
  const top = metrics.startY;
  const right = metrics.startX + metrics.cols * metrics.cellWidth + (metrics.cols - 1) * metrics.gap;
  const bottom = metrics.startY + metrics.rows * metrics.cellHeight + (metrics.rows - 1) * metrics.gap;
  const padding = Math.max(metrics.cellWidth, metrics.cellHeight) * NEAREST_DROP_PADDING_MULTIPLIER;

  if (x < left - padding || x > right + padding || y < top - padding || y > bottom + padding) {
    return null;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const centerX = metrics.startX + col * (metrics.cellWidth + metrics.gap) + metrics.cellWidth / 2;
      const centerY = metrics.startY + row * (metrics.cellHeight + metrics.gap) + metrics.cellHeight * 0.48;
      const distance = Math.hypot(x - centerX, y - centerY);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = row * metrics.cols + col;
      }
    }
  }

  return nearestIndex;
}

export function createUnitGhost(hero: Pick<BoardHero, "grade" | "heroId">, cell: number, alpha = 0.92) {
  return createBoardUnitGhost(hero, cell, alpha);
}
