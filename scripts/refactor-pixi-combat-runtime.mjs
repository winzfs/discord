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

if (!s.includes('from "./pixiCombatRuntime"')) {
  s = s.replace(
    '} from "./pixiBoardView";\n',
    '} from "./pixiBoardView";\nimport { applyTankSlow, findSplashTargets, getBoardFirepower, getHeroDamage, getRoleAccent, pickAttackTarget } from "./pixiCombatRuntime";\n',
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
`function applySupportSplash(refs: GameRefs, target: ActiveEnemy, damage: number) {
  for (const enemy of findSplashTargets(refs.activeEnemies, target)) {
    damageEnemy(refs, enemy, Math.max(1, Math.floor(damage * 0.35)));
  }
}
`,
);

s = s.replace("const target = pickAttackTarget(refs, role);", "const target = pickAttackTarget(refs.activeEnemies, role);");
s = s.replace("const damage = getHeroDamage(refs, hero);", "const damage = getHeroDamage(refs.state, hero);");
s = s.replace("projectile.fill({ color: roleAccent(role), alpha: 1 });", "projectile.fill({ color: getRoleAccent(role), alpha: 1 });");

writeFileSync(path, s);
console.log(`Updated ${path}`);
