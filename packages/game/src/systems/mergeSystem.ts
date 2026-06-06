import { heroes } from "../data/heroes";
import { initialBalance } from "../data/balance";
import { getAllBoardHeroes, getCellIndex, MAX_STACK_PER_CELL, placeHeroOnBoard } from "./boardSystem";
import type { GameState } from "../types/gameState";
import type { BoardCell, BoardHero, HeroDefinition, HeroGrade } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type MergeResult = {
  state: GameState;
  mergedHero: BoardHero | null;
  consumedHeroes: BoardHero[];
  reason?: "not_enough_same_grade" | "max_grade" | "no_hero_for_next_grade";
};

export type MergeAvailability = {
  grade: HeroGrade;
  count: number;
  requiredCount: number;
  canMerge: boolean;
  nextGrade: HeroGrade | null;
};

const gradeOrder: HeroGrade[] = ["common", "rare", "epic", "legendary"];

export function getNextGrade(grade: HeroGrade): HeroGrade | null {
  const gradeIndex = gradeOrder.indexOf(grade);
  if (gradeIndex < 0 || gradeIndex >= gradeOrder.length - 1) return null;
  return gradeOrder[gradeIndex + 1] ?? null;
}

export function getMergeAvailability(state: GameState, grade: HeroGrade): MergeAvailability {
  const count = getAllBoardHeroes(state.board).filter((hero) => hero.grade === grade).length;
  const nextGrade = getNextGrade(grade);

  return {
    grade,
    count,
    requiredCount: initialBalance.mergeRequiredCount,
    canMerge: Boolean(nextGrade) && count >= initialBalance.mergeRequiredCount,
    nextGrade,
  };
}

function pickHeroByGrade(grade: HeroGrade, random: SeededRandom): HeroDefinition | null {
  const candidates = heroes.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0] ?? null;
}

function createMergedHeroId(targets: BoardHero[], nextHeroId: string): string {
  const consumedIds = targets.map((target) => target.instanceId).join("+");
  return `merged:${nextHeroId}:${consumedIds}`;
}

function createCellWithUnits(cell: BoardCell, units: BoardHero[]): BoardCell {
  return {
    ...cell,
    heroId: units[0]?.heroId ?? null,
    units: units.map((unit) => ({ ...unit, position: cell.position })),
  };
}

function removeBoardHeroes(state: GameState, targets: BoardHero[]): GameState {
  const targetIds = new Set(targets.map((target) => target.instanceId));
  const nextBoard = state.board.map((cell) => {
    const nextUnits = cell.units.filter((unit) => !targetIds.has(unit.instanceId));
    return createCellWithUnits(cell, nextUnits);
  });

  return {
    ...state,
    board: nextBoard,
  };
}

function findFirstExistingStackIndex(board: BoardCell[], heroId: string, grade: HeroGrade) {
  if (grade === "mythic") return -1;
  return board.findIndex(
    (cell) =>
      cell.heroId === heroId &&
      cell.units.length > 0 &&
      cell.units.length < MAX_STACK_PER_CELL &&
      cell.units.every((unit) => unit.heroId === heroId && unit.grade !== "mythic"),
  );
}

function placeMergedHeroPreferExistingStack(
  state: GameState,
  hero: Omit<BoardHero, "position">,
): { state: GameState; placedHero: BoardHero | null; reason?: "board_full" } {
  const existingStackIndex = findFirstExistingStackIndex(state.board, hero.heroId, hero.grade);
  if (existingStackIndex < 0) return placeHeroOnBoard(state, hero);

  const targetCell = state.board[existingStackIndex];
  const placedHero: BoardHero = {
    ...hero,
    position: targetCell.position,
  };

  const nextBoard = state.board.map((cell, index) => {
    if (index !== existingStackIndex) return cell;
    return createCellWithUnits(cell, [...cell.units, placedHero]);
  });

  return {
    state: {
      ...state,
      board: nextBoard,
    },
    placedHero,
  };
}

export function mergeHeroes(state: GameState, grade: HeroGrade, random: SeededRandom): MergeResult {
  const mergeTargets = getAllBoardHeroes(state.board)
    .filter((hero) => hero.grade === grade)
    .slice(0, initialBalance.mergeRequiredCount);

  if (mergeTargets.length < initialBalance.mergeRequiredCount) {
    return {
      state,
      mergedHero: null,
      consumedHeroes: [],
      reason: "not_enough_same_grade",
    };
  }

  const nextGrade = getNextGrade(grade);
  if (!nextGrade) {
    return {
      state,
      mergedHero: null,
      consumedHeroes: [],
      reason: "max_grade",
    };
  }

  const nextHeroDefinition = pickHeroByGrade(nextGrade, random);
  if (!nextHeroDefinition) {
    return {
      state,
      mergedHero: null,
      consumedHeroes: [],
      reason: "no_hero_for_next_grade",
    };
  }

  const primaryTarget = mergeTargets[0];
  const removedState = removeBoardHeroes(state, mergeTargets);
  const primaryIndex = getCellIndex(primaryTarget.position, state.boardSize.columns);
  const primaryCell = removedState.board[primaryIndex];
  const preferredState = primaryCell && primaryCell.units.length === 0
    ? {
        ...removedState,
        board: removedState.board.map((cell, index) => index === primaryIndex ? { ...cell, heroId: null, units: [] } : cell),
      }
    : removedState;

  const placement = placeMergedHeroPreferExistingStack(preferredState, {
    instanceId: createMergedHeroId(mergeTargets, nextHeroDefinition.id),
    heroId: nextHeroDefinition.id,
    grade: nextHeroDefinition.grade,
  });

  return {
    state: placement.state,
    mergedHero: placement.placedHero,
    consumedHeroes: mergeTargets,
  };
}
