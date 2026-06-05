import type { GameRefs } from "./pixiGameTypes";
import { clearPixiUnitInfoView, drawPixiUnitInfoView } from "./pixiUnitInfoView";
import { clearPixiUnitRangePreview, drawPixiUnitRangePreview } from "./pixiUnitRangeView";

export type PixiSelectionRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
};

export function clearUnitSelection(refs: GameRefs) {
  refs.selectedCellIndex = null;
  clearPixiUnitInfoView(refs.info);
  clearPixiUnitRangePreview(refs);
}

export function drawSelectedUnitInfo(refs: GameRefs) {
  if (refs.selectedCellIndex === null) {
    clearPixiUnitInfoView(refs.info);
    clearPixiUnitRangePreview(refs);
    return;
  }

  const cell = refs.state.board[refs.selectedCellIndex];
  const hero = cell?.units[cell.units.length - 1];

  if (!cell || !hero) {
    clearUnitSelection(refs);
    return;
  }

  drawPixiUnitRangePreview(refs, refs.selectedCellIndex, hero);
  drawPixiUnitInfoView(refs.info, {
    hero,
    stackCount: cell.units.length,
    cellIndex: refs.selectedCellIndex,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
  });
}

export function clearMenuAndUnitInfo(refs: GameRefs, options: PixiSelectionRuntimeOptions) {
  options.clearMenu(refs);
  clearUnitSelection(refs);
}
