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

export type MythicIngredientProgress = {
  label: string;
  owned: number;
  required: number;
  fulfilled: boolean;
  heroId?: string;
};

export type MythicCraftResult = {
  state: GameState;
  craftedHero: BoardHero | null;
  consumedHeroes: BoardHero[];
  reason?: "missing_recipe" | "missing_ingredients";
};

function ingredientLabel(ingredient: MythicRecipeDefinition["ingredients"][number]) {
  if (ingredient.heroId) {
    const hero = getHeroById(ingredient.heroId);
    return hero?.displayName ?? ingredient.heroId;
  }
  return `${ingredient.grade ?? "any"}:${ingredient.role ?? "any"}`;
}

function matchesIngredient(hero: BoardHero, ingredient: MythicRecipeDefinition["ingredients"][number]): boolean {
  if (ingredient.heroId && hero.heroId !== ingredient.heroId) return false;
  if (ingredient.grade && hero.grade !== ingredient.grade) return false;
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
    if (pickedCount < ingredient.count) missing.push(`${ingredientLabel(ingredient)}x${ingredient.count - pickedCount}`);
  }

  return { picked, missing };
}

export function getMythicIngredientProgress(state: GameState, recipe: MythicRecipeDefinition): MythicIngredientProgress[] {
  const heroes = getAllBoardHeroes(state.board);
  return recipe.ingredients.map((ingredient) => {
    const owned = heroes.filter((hero) => matchesIngredient(hero, ingredient)).length;
    return {
      label: ingredientLabel(ingredient),
      owned,
      required: ingredient.count,
      fulfilled: owned >= ingredient.count,
      heroId: ingredient.heroId,
    };
  });
}

export function getMythicCraftAvailability(state: GameState): MythicCraftAvailability[] {
  return mythicRecipes.map((recipe) => {
    const { missing } = pickIngredients(state, recipe);
    return {
      recipe,
      canCraft: missing.length === 0,
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
      board: removedState.board.map((cell, index) => index === cellIndex ? { ...cell, heroId: craftedHero.heroId, units: [craftedHero] } : cell),
    },
    craftedHero,
    consumedHeroes: picked,
  };
}
