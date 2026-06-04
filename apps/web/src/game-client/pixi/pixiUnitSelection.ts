import type { BoardHero, GameState } from "@discord-random-defense/game";
import { getAllBoardHeroes } from "@discord-random-defense/game";

export type UnitSelectionState = {
  selectedHeroInstanceId: string | null;
};

export function getSelectedHero(state: GameState, selection: UnitSelectionState): BoardHero | null {
  if (!selection.selectedHeroInstanceId) return null;
  return getAllBoardHeroes(state.board).find((hero) => hero.instanceId === selection.selectedHeroInstanceId) ?? null;
}

export function selectTopHeroInCell(state: GameState, selection: UnitSelectionState, cellIndex: number) {
  const cell = state.board[cellIndex];
  const hero = cell?.units[cell.units.length - 1] ?? null;
  selection.selectedHeroInstanceId = hero?.instanceId ?? null;
}

export function clearMissingSelectedHero(state: GameState, selection: UnitSelectionState) {
  if (!selection.selectedHeroInstanceId) return;
  if (!getSelectedHero(state, selection)) selection.selectedHeroInstanceId = null;
}

export function clearUnitSelection(selection: UnitSelectionState) {
  selection.selectedHeroInstanceId = null;
}
