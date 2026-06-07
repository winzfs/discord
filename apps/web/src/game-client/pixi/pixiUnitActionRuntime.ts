import {
  canMergeStackCell,
  mergeStackedCell,
  sellTopUnitInCell,
} from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { getCellCenter } from "./pixiBoardRuntime";
import { createPixiUnitMenuView } from "./pixiUnitMenuView";
import { showUnitRevealFx } from "./pixiUnitRevealFxRuntime";

export type PixiUnitActionRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
  clearMenuAndUnitInfo: (refs: GameRefs) => void;
  drawSelectedUnitInfo: (refs: GameRefs) => void;
  render: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

export function showUnitMenu(
  refs: GameRefs,
  cellIndex: number,
  options: PixiUnitActionRuntimeOptions,
) {
  if (refs.movementLocked) return;

  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;

  options.clearMenu(refs);
  refs.selectedCellIndex = cellIndex;
  options.drawSelectedUnitInfo(refs);

  const menu = createPixiUnitMenuView({
    center: getCellCenter(refs, cellIndex),
    rendererWidth: refs.app.renderer.width,
    canMerge: canMergeStackCell(refs.state, cellIndex),
    onMerge: () => mergeMenuAction(refs, cellIndex, options),
    onSell: () => sellMenuAction(refs, cellIndex, options),
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

export function mergeMenuAction(
  refs: GameRefs,
  cellIndex: number,
  options: PixiUnitActionRuntimeOptions,
) {
  options.clearMenuAndUnitInfo(refs);

  const result = mergeStackedCell(refs.state, cellIndex, refs.random);

  if (!result.mergedHero) {
    const message =
      result.reason === "not_full_stack"
        ? "3마리 필요"
        : result.reason === "max_grade"
          ? "최고 등급"
          : "합성 불가";

    options.floatText(
      refs,
      message,
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.52,
      colors.red,
    );
    return;
  }

  refs.state = result.state;
  refs.lastSummonedIndex = cellIndex;
  options.render(refs);
  showUnitRevealFx(refs, result.mergedHero, "merge");
  options.floatText(
    refs,
    "합성!",
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.52,
    colors.yellow,
  );
}

export function sellMenuAction(
  refs: GameRefs,
  cellIndex: number,
  options: PixiUnitActionRuntimeOptions,
) {
  options.clearMenuAndUnitInfo(refs);

  const result = sellTopUnitInCell(refs.state, cellIndex);

  if (!result.soldHero) {
    options.floatText(
      refs,
      "판매 불가",
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.52,
      colors.red,
    );
    return;
  }

  refs.state = result.state;
  options.render(refs);
  options.floatText(
    refs,
    `판매 +${result.reward}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.52,
    colors.green,
  );
}


export function canShowMergeIndicator(refs: GameRefs, cellIndex: number) {
  return canMergeStackCell(refs.state, cellIndex);
}
