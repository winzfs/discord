import { getHeroById, type MythicRecipeIngredient } from "@discord-random-defense/game";

function gradeLabel(grade: MythicRecipeIngredient["grade"] | undefined) {
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  if (grade === "common") return "일반";
  if (grade === "mythic") return "신화";
  return "등급무관";
}

function roleLabel(role: MythicRecipeIngredient["role"] | undefined) {
  if (role === "damage") return "딜러";
  if (role === "tank") return "탱커";
  if (role === "support") return "지원";
  return "무관";
}

export function formatMythicIngredientText(ingredient: MythicRecipeIngredient) {
  if (ingredient.heroId) {
    const hero = getHeroById(ingredient.heroId);
    return `${hero?.displayName ?? ingredient.heroId}x${ingredient.count}`;
  }

  return `${gradeLabel(ingredient.grade)} ${roleLabel(ingredient.role)}x${ingredient.count}`;
}

export function formatMythicRecipeText(ingredients: MythicRecipeIngredient[]) {
  return ingredients.map((ingredient) => formatMythicIngredientText(ingredient)).join(" + ");
}
