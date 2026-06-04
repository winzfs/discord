import { heroes } from "../data/heroes";
import { MAX_STACK_PER_CELL } from "./boardSystem";
import type { GameState } from "../types/gameState";
import type { BoardHero, HeroDefinition, HeroGrade } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type StackMergeResult = {
  state: GameState;
  mergedHero: BoardHero | null;
  consumedHeroes: BoardHero[];
  reason?: "invalid_cell" | "not_full_stack" | "mixed_stack" | "max_grade" | "no_hero_for_next_grade";
};

const gradeOrder: HeroGrade[] = ["common", "rare", "epic", "legendary"];

export function getNextStackMergeGrade(grade: HeroGrade): HeroGrade | null {
  const gradeIndex = gradeOrder.indexOf(grade);
  if (gradeIndex < 0 || gradeIndex >= gradeOrder.length - 1) return null;
  return gradeOrder[gradeIndex + 1] ?? null;
}

function pickHeroByGrade(grade: HeroGrade, random: SeededRandom): HeroDefinition | null {
  const candidates = heroes.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0] ?? null;
}

function createStackMergedHeroId(targets: BoardHero[], nextHeroId: string): string {
  return `stack-merge:${nextHeroId}:${targets.map((target) => target.instanceId).join("+")}`;
}

export function canMergeStackCell(state: GameState, cellIndex: number): boolean {
  const cell = state.board[cellIndex];
  if (!cell || cell.units.length < MAX_STACK_PER_CELL) return false;

  const firstUnit = cell.units[0];
  if (!firstUnit) return false;

  const sameHeroStack = cell.units.every((unit) => unit.heroId === firstUnit.heroId && unit.grade === firstUnit.grade);
  return sameHeroStack && Boolean(getNextStackMergeGrade(firstUnit.grade));
}

export function mergeStackedCell(state: GameState, cellIndex: number, random: SeededRandom): StackMergeResult {
  const cell = state.board[cellIndex];
  if (!cell) {
    return { state, mergedHero: null, consumedHeroes: [], reason: "invalid_cell" };
  }

  if (cell.units.length < MAX_STACK_PER_CELL) {
    return { state, mergedHero: null, consumedHeroes: [], reason: "not_full_stack" };
  }

  const firstUnit = cell.units[0];
  if (!firstUnit || cell.units.some((unit) => unit.heroId !== firstUnit.heroId || unit.grade !== firstUnit.grade)) {
    return { state, mergedHero: null, consumedHeroes: [], reason: "mixed_stack" };
  }

  const nextGrade = getNextStackMergeGrade(firstUnit.grade);
  if (!nextGrade) {
    return { state, mergedHero: null, consumedHeroes: [], reason: "max_grade" };
  }

  const nextHero = pickHeroByGrade(nextGrade, random);
  if (!nextHero) {
    return { state, mergedHero: null, consumedHeroes: [], reason: "no_hero_for_next_grade" };
  }

  const mergedHero: BoardHero = {
    instanceId: createStackMergedHeroId(cell.units, nextHero.id),
    heroId: nextHero.id,
    grade: nextHero.grade,
    position: cell.position,
  };

  const nextBoard = state.board.map((boardCell, index) => {
    if (index !== cellIndex) return boardCell;
    return {
      ...boardCell,
      heroId: mergedHero.heroId,
      units: [mergedHero],
    };
  });

  return {
    state: {
      ...state,
      board: nextBoard,
    },
    mergedHero,
    consumedHeroes: cell.units,
  };
}
