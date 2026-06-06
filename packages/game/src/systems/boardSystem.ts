import { initialBalance } from "../data/balance";
import type { BoardCell, BoardHero, BoardPosition } from "../types/hero";
import type { GameState } from "../types/gameState";

export const MAX_STACK_PER_CELL = 3;

export type MoveBoardHeroResult = {
  state: GameState;
  movedHero: BoardHero | null;
  movedHeroes?: BoardHero[];
  swappedHeroes?: BoardHero[];
  action?: "move" | "stack" | "swap";
  reason?: "empty_source" | "same_cell" | "target_full" | "invalid_cell" | "mythic_stack_blocked";
};

export function createInitialBoard(rows: number, columns: number): BoardCell[] {
  return Array.from({ length: rows * columns }, (_, index) => ({
    position: {
      row: Math.floor(index / columns),
      column: index % columns,
    },
    heroId: null,
    units: [],
  }));
}

export function getCellIndex(position: BoardPosition, columns: number): number {
  return position.row * columns + position.column;
}

export function getAllBoardHeroes(board: BoardCell[]): BoardHero[] {
  return board.flatMap((cell) => cell.units);
}

export function getBoardUnitCount(board: BoardCell[]): number {
  return getAllBoardHeroes(board).length;
}

export function getBoardCapacity(board: BoardCell[]): number {
  return board.length * MAX_STACK_PER_CELL;
}

function isMythicHero(hero: Pick<BoardHero, "grade">): boolean {
  return hero.grade === "mythic";
}

export function canPlaceHeroInCell(cell: BoardCell, heroId: string, grade?: BoardHero["grade"]): boolean {
  if (grade === "mythic" && cell.units.length > 0) return false;
  if (cell.units.some((unit) => unit.grade === "mythic")) return false;
  if (cell.units.length >= MAX_STACK_PER_CELL) return false;
  if (cell.heroId === null) return true;
  return cell.heroId === heroId;
}

export function findStackableCellIndex(board: BoardCell[], heroId: string, grade?: BoardHero["grade"]): number {
  if (grade === "mythic") return -1;
  return board.findIndex((cell) => canPlaceHeroInCell(cell, heroId, grade) && cell.heroId === heroId);
}

export function findEmptyCellIndex(board: BoardCell[]): number {
  return board.findIndex((cell) => cell.heroId === null && cell.units.length === 0);
}

export function findAvailableCellIndex(board: BoardCell[], heroId: string, grade?: BoardHero["grade"]): number {
  const stackableIndex = findStackableCellIndex(board, heroId, grade);
  if (stackableIndex >= 0) return stackableIndex;
  return findEmptyCellIndex(board);
}

function updateUnitsPosition(units: BoardHero[], position: BoardPosition): BoardHero[] {
  return units.map((unit) => ({
    ...unit,
    position,
  }));
}

function createCellWithUnits(cell: BoardCell, units: BoardHero[]): BoardCell {
  return {
    ...cell,
    heroId: units[0]?.heroId ?? null,
    units: updateUnitsPosition(units, cell.position),
  };
}

export function placeHeroOnBoard(state: GameState, hero: Omit<BoardHero, "position">): { state: GameState; placedHero: BoardHero | null; reason?: "board_full" } {
  const cellIndex = findAvailableCellIndex(state.board, hero.heroId, hero.grade);
  if (cellIndex < 0) {
    return { state, placedHero: null, reason: "board_full" };
  }

  const targetCell = state.board[cellIndex];
  const placedHero: BoardHero = {
    ...hero,
    position: targetCell.position,
  };
  const nextBoard = state.board.map((cell, index) => {
    if (index !== cellIndex) return cell;
    return {
      ...cell,
      heroId: placedHero.heroId,
      units: [...cell.units, placedHero],
    };
  });

  return {
    state: {
      ...state,
      board: nextBoard,
    },
    placedHero,
  };
}

export function moveOneHeroToCell(state: GameState, sourceCellIndex: number, targetCellIndex: number): MoveBoardHeroResult {
  if (sourceCellIndex === targetCellIndex) {
    return { state, movedHero: null, action: "move", reason: "same_cell" };
  }

  const sourceCell = state.board[sourceCellIndex];
  const targetCell = state.board[targetCellIndex];
  if (!sourceCell || !targetCell) {
    return { state, movedHero: null, action: "move", reason: "invalid_cell" };
  }

  const movingUnits = sourceCell.units;
  const movingHero = movingUnits[0];
  if (!movingHero || movingUnits.length === 0) {
    return { state, movedHero: null, action: "move", reason: "empty_source" };
  }

  if (targetCell.heroId === null) {
    const movedUnits = updateUnitsPosition(movingUnits, targetCell.position);
    const nextBoard = state.board.map((cell, index) => {
      if (index === sourceCellIndex) return createCellWithUnits(cell, []);
      if (index === targetCellIndex) return createCellWithUnits(cell, movedUnits);
      return cell;
    });

    return {
      state: { ...state, board: nextBoard },
      movedHero: movedUnits[0] ?? null,
      movedHeroes: movedUnits,
      action: "move",
    };
  }

  if (targetCell.heroId === movingHero.heroId) {
    if (targetCell.units.some(isMythicHero) || movingUnits.some(isMythicHero)) {
      return { state, movedHero: null, action: "stack", reason: "mythic_stack_blocked" };
    }
    if (targetCell.units.length + movingUnits.length > MAX_STACK_PER_CELL) {
      return { state, movedHero: null, action: "stack", reason: "target_full" };
    }

    const movedUnits = updateUnitsPosition(movingUnits, targetCell.position);
    const nextBoard = state.board.map((cell, index) => {
      if (index === sourceCellIndex) return createCellWithUnits(cell, []);
      if (index === targetCellIndex) return createCellWithUnits(cell, [...cell.units, ...movedUnits]);
      return cell;
    });

    return {
      state: { ...state, board: nextBoard },
      movedHero: movedUnits[0] ?? null,
      movedHeroes: movedUnits,
      action: "stack",
    };
  }

  const sourceUnits = updateUnitsPosition(sourceCell.units, targetCell.position);
  const targetUnits = updateUnitsPosition(targetCell.units, sourceCell.position);
  const nextBoard = state.board.map((cell, index) => {
    if (index === sourceCellIndex) return createCellWithUnits(cell, targetUnits);
    if (index === targetCellIndex) return createCellWithUnits(cell, sourceUnits);
    return cell;
  });

  return {
    state: { ...state, board: nextBoard },
    movedHero: { ...movingHero, position: targetCell.position },
    movedHeroes: sourceUnits,
    swappedHeroes: [...sourceUnits, ...targetUnits],
    action: "swap",
  };
}

export function isBoardFull(board: BoardCell[]): boolean {
  return findEmptyCellIndex(board) < 0 && board.every((cell) => cell.units.length >= MAX_STACK_PER_CELL);
}

export function getBoardFillRatio(board: BoardCell[]): number {
  return getBoardCapacity(board) > 0 ? getBoardUnitCount(board) / getBoardCapacity(board) : 0;
}

export function getDefaultBoardCapacity(): number {
  return initialBalance.boardRows * initialBalance.boardColumns * MAX_STACK_PER_CELL;
}
