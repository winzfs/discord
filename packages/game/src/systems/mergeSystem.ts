import { heroes } from "../data/heroes";
import { initialBalance } from "../data/balance";
import type { GameState } from "../types/gameState";
import type { BoardHero, HeroDefinition, HeroGrade } from "../types/hero";
import type { SeededRandom } from "../utils/random";

export type MergeResult = {
  state: GameState;
  mergedHero: BoardHero | null;
  consumedHeroes: BoardHero[];
  reason?: "not_enough_same_grade" | "max_grade" | "no_hero_for_next_grade";
};

const gradeOrder: HeroGrade[] = ["common", "rare", "epic", "legendary"];

export function getNextGrade(grade: HeroGrade): HeroGrade | null {
  const gradeIndex = gradeOrder.indexOf(grade);
  if (gradeIndex < 0 || gradeIndex >= gradeOrder.length - 1) return null;
  return gradeOrder[gradeIndex + 1] ?? null;
}

function pickHeroByGrade(grade: HeroGrade, random: SeededRandom): HeroDefinition | null {
  const candidates = heroes.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0] ?? null;
}

function getBoardIndex(hero: BoardHero, columns: number): number {
  return hero.position.row * columns + hero.position.column;
}

function createMergedHeroId(targets: BoardHero[], nextHeroId: string): string {
  const consumedIds = targets.map((target) => target.instanceId).join("+");
  return `merged:${nextHeroId}:${consumedIds}`;
}

export function mergeHeroes(state: GameState, grade: HeroGrade, random: SeededRandom): MergeResult {
  const mergeTargets = state.board
    .filter((slot): slot is BoardHero => slot !== null && slot.grade === grade)
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

  const nextBoard = [...state.board];
  const primaryTarget = mergeTargets[0];
  const primaryIndex = getBoardIndex(primaryTarget, state.boardSize.columns);

  for (const target of mergeTargets) {
    nextBoard[getBoardIndex(target, state.boardSize.columns)] = null;
  }

  const mergedHero: BoardHero = {
    instanceId: createMergedHeroId(mergeTargets, nextHeroDefinition.id),
    heroId: nextHeroDefinition.id,
    grade: nextHeroDefinition.grade,
    position: primaryTarget.position,
  };

  nextBoard[primaryIndex] = mergedHero;

  return {
    state: {
      ...state,
      board: nextBoard,
    },
    mergedHero,
    consumedHeroes: mergeTargets,
  };
}
