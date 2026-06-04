import type { Container } from "pixi.js";
import type { GameState } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import { drawUnitInfoPanelView } from "./pixiUnitInfoPanelView";
import { clearMissingSelectedHero, clearUnitSelection, getSelectedHero, selectTopHeroInCell, type UnitSelectionState } from "./pixiUnitSelection";

export type UnitInfoRuntimeRefs = UnitSelectionState & {
  state: GameState;
  info: Container;
};

export function clearUnitInfoRuntime(refs: UnitInfoRuntimeRefs) {
  clearUnitSelection(refs);
  refs.info.removeChildren();
}

export function selectUnitInfoHeroInCell(refs: UnitInfoRuntimeRefs, cellIndex: number) {
  selectTopHeroInCell(refs.state, refs, cellIndex);
}

export function drawUnitInfoRuntime(refs: UnitInfoRuntimeRefs, layout: GameLayout) {
  clearMissingSelectedHero(refs.state, refs);
  drawUnitInfoPanelView(refs.info, getSelectedHero(refs.state, refs), layout);
}
