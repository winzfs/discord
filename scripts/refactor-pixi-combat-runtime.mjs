import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

const must = (text) => {
  if (!s.includes(text)) throw new Error(`Missing expected text: ${text}`);
};

must('function spawnAttackEffects(refs: GameRefs)');
must('function getFirepower(refs: GameRefs)');
must('function applySupportSplash(refs: GameRefs, target: ActiveEnemy, damage: number)');

s = s.replace(
  'import type { BoardHero, GameState, HeroRole } from "@discord-random-defense/game";',
  'import type { BoardHero, GameState } from "@discord-random-defense/game";',
);

s = s.replace(
  '  getMythicCraftAvailability,',
  '  getMythicCraftAvailability,\n  getMythicIngredientProgress,',
);

if (!s.includes('from "./pixiCombatRuntime"')) {
  s = s.replace(
    '} from "./pixiBoardView";\n',
    '} from "./pixiBoardView";\nimport { applyTankSlow, findSplashTargets, getBoardFirepower, getHeroDamage, getKillRewardBonus, getRoleAccent, getSplashDamageRatio, getSplashRadius, pickHeroAttackTarget } from "./pixiCombatRuntime";\n',
  );
}

const blocks = [
`function roleAccent(role: HeroRole | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

`,
`function pickAttackTarget(refs: GameRefs, role: HeroRole | undefined): ActiveEnemy | null {
  const liveEnemies = refs.activeEnemies.filter((enemy) => enemy.alive && enemy.progress >= 0);
  if (liveEnemies.length === 0) return null;
  if (role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }
  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

`,
`function getHeroDamage(refs: GameRefs, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase = hero.grade === "mythic" ? 150 : hero.grade === "legendary" ? 95 : hero.grade === "epic" ? 52 : hero.grade === "rare" ? 28 : 16;
  const roleMultiplier = role === "damage" ? 1.18 : role === "tank" ? 0.82 : 0.72;
  return Math.round(gradeBase * roleMultiplier * (1 + refs.state.powerUpgradeLevel * 0.16));
}

`,
`function applyTankSlow(enemy: ActiveEnemy) {
  enemy.speed = Math.max(0.22, enemy.speed * 0.92);
}

`,
];

for (const block of blocks) s = s.replace(block, "");

s = s.replace(
`function getFirepower(refs: GameRefs) {
  return getAllBoardHeroes(refs.state.board).reduce((sum, hero) => sum + getHeroDamage(refs, hero), 0);
}
`,
`function getFirepower(refs: GameRefs) {
  return getBoardFirepower(refs.state);
}
`,
);

s = s.replace(
`function applySupportSplash(refs: GameRefs, target: ActiveEnemy, damage: number) {
  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.id === target.id) continue;
    if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 72) {
      damageEnemy(refs, enemy, Math.max(1, Math.floor(damage * 0.35)));
    }
  }
}
`,
`function applySupportSplash(refs: GameRefs, hero: BoardHero, target: ActiveEnemy, damage: number) {
  const radius = getSplashRadius(hero);
  const ratio = getSplashDamageRatio(hero);
  for (const enemy of findSplashTargets(refs.activeEnemies, target, radius)) {
    damageEnemy(refs, enemy, Math.max(1, Math.floor(damage * ratio)), hero);
  }
}
`,
);

s = s.replace(
`function damageEnemy(refs: GameRefs, enemy: ActiveEnemy, damage: number) {`,
`function damageEnemy(refs: GameRefs, enemy: ActiveEnemy, damage: number, sourceHero?: BoardHero) {`,
);

s = s.replace(
`  refs.state = {
    ...refs.state,
    resources: refs.state.resources + enemy.reward,`,
`  const rewardBonus = sourceHero ? getKillRewardBonus(sourceHero) : 0;
  refs.state = {
    ...refs.state,
    resources: refs.state.resources + enemy.reward + rewardBonus,`,
);

s = s.replace(
`  refs.waveReward += enemy.reward;`,
`  refs.waveReward += enemy.reward + (sourceHero ? getKillRewardBonus(sourceHero) : 0);`,
);

s = s.replace(
`  floatText(refs, ` + "`+${enemy.reward}`" + `, enemy.x, enemy.y - 26, colors.green);`,
`  floatText(refs, "+" + (enemy.reward + rewardBonus), enemy.x, enemy.y - 26, colors.green);`,
);

s = s.replace("const target = pickAttackTarget(refs.activeEnemies, role);", "const target = pickHeroAttackTarget(refs.activeEnemies, hero, role);");
s = s.replace("const damage = getHeroDamage(refs.state, hero);", "const damage = getHeroDamage(refs.state, hero);");
s = s.replace("projectile.fill({ color: roleAccent(role), alpha: 1 });", "projectile.fill({ color: getRoleAccent(role), alpha: 1 });");
s = s.replace("if (role === \"tank\") applyTankSlow(target);", "if (role === \"tank\") applyTankSlow(target, hero);");
s = s.replace("damageEnemy(refs, target, damage);", "damageEnemy(refs, target, damage, hero);");
s = s.replace("if (role === \"support\") applySupportSplash(refs, target, damage);", "if (role === \"support\" || hero.heroId.includes(\"mage\") || hero.heroId.includes(\"storm\")) applySupportSplash(refs, hero, target, damage);");

s = s.replace(
  /function ingredientText\([\s\S]*?\n}\n\nfunction showMythicMenu/,
  `function ingredientText(ingredient: { heroId?: string; grade?: string; role?: string; count: number }) {
  if (ingredient.heroId) {
    const hero = getHeroById(ingredient.heroId);
    return (hero?.displayName ?? ingredient.heroId) + "x" + ingredient.count;
  }
  const grade = ingredient.grade ?? "any";
  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : grade === "mythic" ? "신화" : "등급무관";
  const roleLabel = ingredient.role === "damage" ? "딜러" : ingredient.role === "tank" ? "탱커" : ingredient.role === "support" ? "지원" : "무관";
  return gradeLabel + " " + roleLabel + "x" + ingredient.count;
}

function showMythicMenu`,
);

s = s.replace(
  'const height = 72 + list.length * 54;',
  'const height = Math.min(refs.app.renderer.height - 28, 88 + list.length * 76);',
);

s = s.replaceAll('58 + index * 54', '64 + index * 76');
s = s.replaceAll('makePanel(width - 24, 46, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10)', 'makePanel(width - 24, 68, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10)');

s = s.replace(
  'const recipe = makeText(item.recipe.ingredients.map((ingredient) => ingredientText(ingredient)).join(" + "), 10, item.canCraft ? colors.yellow : 0xb7afa8);',
  'const progress = getMythicIngredientProgress(refs.state, item.recipe);\n    const recipe = makeText(progress.map((part) => part.label + " " + part.owned + "/" + part.required).join("  "), 10, item.canCraft ? colors.yellow : 0xb7afa8);',
);

s = s.replace(
  'recipe.y = 25;\n    row.addChild(recipe);',
  'recipe.y = 25;\n    row.addChild(recipe);\n\n    const desc = makeText(item.recipe.description, 9, item.canCraft ? colors.white : 0xb7afa8);\n    desc.x = 12;\n    desc.y = 45;\n    row.addChild(desc);',
);

writeFileSync(path, s);
console.log(`Updated ${path}`);
