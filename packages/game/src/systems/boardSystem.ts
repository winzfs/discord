import { initialBalance } from "../data/balance";
import type { BoardCell, BoardHero, BoardPosition } from "../types/hero";
import type { GameState } from "../types/gameState";

export const MAX_STACK_PER_CELL = 3;

export type MoveBoardHeroResult = {
  state: GameState;
  movedHero: BoardHero | null;
  reason?: "empty_source" | "same_cell" | "target_full" | "different_hero" | "invalid_cell";
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

export function canPlaceHeroInCell(cell: BoardCell, heroId: string): boolean {
  if (cell.units.length >= MAX_STACK_PER_CELL) return false;
  if (cell.heroId === null) return true;
  return cell.heroId === heroId;
}

export function findStackableCellIndex(board: BoardCell[], heroId: string): number {
  return board.findIndex((cell) => cell.heroId === heroId && cell.units.length < MAX_STACK_PER_CELL);
}

export function findEmptyCellIndex(board: BoardCell[]): number {
  return board.findIndex((cell) => cell.heroId === null && cell.units.length === 0);
}

export function findAvailableCellIndex(board: BoardCell[], heroId: string): number {
  const stackableIndex = findStackableCellIndex(board, heroId);
  if (stackableIndex >= 0) return stackableIndex;
  return findEmptyCellIndex(board);
}

export function placeHeroOnBoard(state: GameState, hero: Omit<BoardHero, "position">): { state: GameState; placedHero: BoardHero | null; reason?: "board_full" } {
  const cellIndex = findAvailableCellIndex(state.board, hero.heroId);
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
    return { state, movedHero: null, reason: "same_cell" };
  }

  const sourceCell = state.board[sourceCellIndex];
  const targetCell = state.board[targetCellIndex];
  if (!sourceCell || !targetCell) {
    return { state, movedHero: null, reason: "invalid_cell" };
  }

  const movingHero = sourceCell.units[sourceCell.units.length - 1];
  if (!movingHero) {
    return { state, movedHero: null, reason: "empty_source" };
  }

  if (targetCell.units.length >= MAX_STACK_PER_CELL) {
    return { state, movedHero: null, reason: "target_full" };
  }

  if (targetCell.heroId !== null && targetCell.heroId !== movingHero.heroId) {
    return { state, movedHero: null, reason: "different_hero" };
  }

  const movedHero: BoardHero = {
    ...movingHero,
    position: targetCell.position,
  };

  const nextBoard = state.board.map((cell, index) => {
    if (index === sourceCellIndex) {
      const nextUnits = cell.units.slice(0, -1);
      return {
        ...cell,
        heroId: nextUnits.length > 0 ? cell.heroId : null,
        units: nextUnits,
      };
    }

    if (index === targetCellIndex) {
      return {
        ...cell,
        heroId: movedHero.heroId,
        units: [...cell.units, movedHero],
      };
    }

    return cell;
  });

  return {
    state: {
      ...state,
      board: nextBoard,
    },
    movedHero,
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
