import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

const before = [
  'function ingredientText(grade: string, role: string | undefined, count: number) {',
  '  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : "신화";',
  '  const roleLabel = role === "damage" ? "딜러" : role === "tank" ? "탱커" : role === "support" ? "지원" : "무관";',
  '  return `${gradeLabel} ${roleLabel}x${count}`;',
  '}',
].join("\n");

const after = [
  'function ingredientText(ingredient: { heroId?: string; grade?: string; role?: string; count: number }) {',
  '  if (ingredient.heroId) {',
  '    const hero = getHeroById(ingredient.heroId);',
  '    return `${hero?.displayName ?? ingredient.heroId}x${ingredient.count}`;',
  '  }',
  '',
  '  const gradeLabel = ingredient.grade === "legendary" ? "전설" : ingredient.grade === "epic" ? "영웅" : ingredient.grade === "rare" ? "희귀" : ingredient.grade === "common" ? "일반" : "신화";',
  '  const roleLabel = ingredient.role === "damage" ? "딜러" : ingredient.role === "tank" ? "탱커" : ingredient.role === "support" ? "지원" : "무관";',
  '  return `${gradeLabel} ${roleLabel}x${ingredient.count}`;',
  '}',
].join("\n");

if (s.includes(before)) {
  s = s.replace(before, after);
}

const oldUsage = 'item.recipe.ingredients.map((ingredient) => ingredientText(ingredient.grade, ingredient.role, ingredient.count)).join(" + ")';
const newUsage = 'item.recipe.ingredients.map((ingredient) => ingredientText(ingredient)).join(" + ")';
if (s.includes(oldUsage)) {
  s = s.replace(oldUsage, newUsage);
}

writeFileSync(path, s);
console.log(`Fixed mythic recipe display in ${path}`);
