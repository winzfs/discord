import { heroes } from "../data/heroes";
import { initialBalance } from "../data/balance";
import { getAllBoardHeroes, getCellIndex, placeHeroOnBoard } from "./boardSystem";
import type { GameState } from "../types/gameState";
import type { BoardHero, HeroDefinition, HeroGrade } from "../types/hero";
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

function removeBoardHeroes(state: GameState, targets: BoardHero[]): GameState {
  const targetIds = new Set(targets.map((target) => target.instanceId));
  const nextBoard = state.board.map((cell) => {
    const nextUnits = cell.units.filter((unit) => !targetIds.has(unit.instanceId));
    return {
      ...cell,
      heroId: nextUnits.length > 0 ? cell.heroId : null,
      units: nextUnits,
    };
  });

  return {
    ...state,
    board: nextBoard,
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

  const placement = placeHeroOnBoard(preferredState, {
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
