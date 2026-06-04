import { getHeroById } from "../data/heroes";
import { mythicRecipes, type MythicRecipeDefinition } from "../data/mythicRecipes";
import { getAllBoardHeroes, getCellIndex } from "./boardSystem";
import type { GameState } from "../types/gameState";
import type { BoardHero } from "../types/hero";

export type MythicCraftAvailability = {
  recipe: MythicRecipeDefinition;
  canCraft: boolean;
  missing: string[];
};

export type MythicCraftResult = {
  state: GameState;
  craftedHero: BoardHero | null;
  consumedHeroes: BoardHero[];
  reason?: "missing_recipe" | "not_enough_luck_stones" | "missing_ingredients";
};

function matchesIngredient(hero: BoardHero, ingredient: MythicRecipeDefinition["ingredients"][number]): boolean {
  if (hero.grade !== ingredient.grade) return false;
  if (!ingredient.role) return true;
  return getHeroById(hero.heroId)?.role === ingredient.role;
}

function pickIngredients(state: GameState, recipe: MythicRecipeDefinition) {
  const remaining = [...getAllBoardHeroes(state.board)];
  const picked: BoardHero[] = [];
  const missing: string[] = [];

  for (const ingredient of recipe.ingredients) {
    let pickedCount = 0;
    for (let i = remaining.length - 1; i >= 0 && pickedCount < ingredient.count; i -= 1) {
      const hero = remaining[i];
      if (!hero || !matchesIngredient(hero, ingredient)) continue;
      picked.push(hero);
      remaining.splice(i, 1);
      pickedCount += 1;
    }
    if (pickedCount < ingredient.count) missing.push(`${ingredient.grade}:${ingredient.role ?? "any"}:${ingredient.count - pickedCount}`);
  }

  return { picked, missing };
}

export function getMythicCraftAvailability(state: GameState): MythicCraftAvailability[] {
  return mythicRecipes.map((recipe) => {
    const { missing } = pickIngredients(state, recipe);
    return {
      recipe,
      canCraft: state.luckStones >= recipe.luckStoneCost && missing.length === 0,
      missing,
    };
  });
}

function removeBoardHeroes(state: GameState, targets: BoardHero[]): GameState {
  const targetIds = new Set(targets.map((target) => target.instanceId));
  return {
    ...state,
    board: state.board.map((cell) => {
      const units = cell.units.filter((unit) => !targetIds.has(unit.instanceId));
      return { ...cell, heroId: units[0]?.heroId ?? null, units };
    }),
  };
}

export function craftMythicHero(state: GameState, recipeId: string): MythicCraftResult {
  const recipe = mythicRecipes.find((candidate) => candidate.id === recipeId);
  if (!recipe) return { state, craftedHero: null, consumedHeroes: [], reason: "missing_recipe" };
  if (state.luckStones < recipe.luckStoneCost) return { state, craftedHero: null, consumedHeroes: [], reason: "not_enough_luck_stones" };

  const { picked, missing } = pickIngredients(state, recipe);
  if (missing.length > 0) return { state, craftedHero: null, consumedHeroes: picked, reason: "missing_ingredients" };

  const definition = getHeroById(recipe.id);
  const first = picked[0];
  if (!definition || !first) return { state, craftedHero: null, consumedHeroes: picked, reason: "missing_recipe" };

  const removedState = removeBoardHeroes(state, picked);
  const targetIndex = getCellIndex(first.position, state.boardSize.columns);
  const targetCell = removedState.board[targetIndex] ?? removedState.board.find((cell) => cell.units.length === 0);
  if (!targetCell) return { state, craftedHero: null, consumedHeroes: picked, reason: "missing_ingredients" };

  const craftedHero: BoardHero = {
    instanceId: `crafted-${recipe.id}-${state.clearedWaves}-${state.score}`,
    heroId: definition.id,
    grade: definition.grade,
    position: targetCell.position,
  };
  const cellIndex = getCellIndex(targetCell.position, state.boardSize.columns);

  return {
    state: {
      ...removedState,
      luckStones: removedState.luckStones - recipe.luckStoneCost,
      board: removedState.board.map((cell, index) => index === cellIndex ? { ...cell, heroId: craftedHero.heroId, units: [craftedHero] } : cell),
    },
    craftedHero,
    consumedHeroes: picked,
  };
}
