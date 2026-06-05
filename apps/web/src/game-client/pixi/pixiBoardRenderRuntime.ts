import type { GameLayout } from "./gameLayout";
import type { GameRefs } from "./pixiGameTypes";
import { drawBoardCells } from "./pixiBoardView";
import { getBoardMetrics } from "./pixiBoardRuntime";
import { beginCellDrag, type PixiDragRuntimeOptions } from "./pixiDragRuntime";
import { canShowMergeIndicator } from "./pixiUnitActionRuntime";

export function drawBoard(
  refs: GameRefs,
  layout: GameLayout,
  createDragRuntimeOptions: () => PixiDragRuntimeOptions,
) {
  const metrics = getBoardMetrics(refs, layout);

  drawBoardCells(
    refs.board,
    refs.state.board,
    metrics,
    (cellIndex) => canShowMergeIndicator(refs, cellIndex),
    {
      canDrag: !refs.movementLocked,
      onCellPointerDown: (cellIndex, globalX, globalY, cellSize) =>
        beginCellDrag(
          refs,
          cellIndex,
          globalX,
          globalY,
          cellSize,
          createDragRuntimeOptions(),
        ),
    },
    {
      heroSpriteAttacks: refs.heroSpriteAttacks,
      heroSpriteOffsets: refs.heroSpriteOffsets,
      mythicUltimateCharges: refs.mythicUltimateCharges,
      now: Date.now(),
    },
  );
}
