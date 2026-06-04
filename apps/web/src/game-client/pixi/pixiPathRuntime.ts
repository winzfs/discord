import type { GameLayout } from "./gameLayout";

export function getPixiPathPoint(layout: GameLayout, progress: number) {
  const left = Math.max(24, layout.boardX - 42);
  const right = Math.min(layout.width - 24, layout.boardX + layout.boardWidth + 42);
  const top = Math.max(layout.mapTop + 44, layout.boardY - 50);
  const bottom = Math.min(layout.height - 176, layout.boardY + layout.boardHeight + 48);
  const phase = Math.max(0, Math.min(1, progress)) * 4;

  if (phase < 1) return { x: left, y: bottom - (bottom - top) * phase };
  if (phase < 2) return { x: left + (right - left) * (phase - 1), y: top };
  if (phase < 3) return { x: right, y: top + (bottom - top) * (phase - 2) };
  return { x: right - (right - left) * (phase - 3), y: bottom };
}
