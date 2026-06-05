import { Graphics } from "pixi.js";
import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { createGameLayout } from "./gameLayout";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { MAX_ATTACKERS_PER_TICK } from "./pixiGameTypes";
import { updateEnemyViewHp } from "./pixiEnemyView";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { getProgressHeroPower, applyEconomyRewardBonus } from "./pixiProgressBonuses";
import { getPixiUnitAttackRange, isPointInPixiUnitRange } from "./pixiUnitRange";

export type PixiCombatRuntimeOptions = {
  getCellCenter: (refs: GameRefs, cellIndex: number) => { x: number; y: number; cell: number };
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
  invalidateControls: (refs: GameRefs) => void;
  drawTopHud: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
  drawControls: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
  drawBoard: (refs: GameRefs, layout: ReturnType<typeof createGameLayout>) => void;
};

const SPRITE_ATTACK_HERO_IDS = new Set(["tracer", "kiriko", "dva", "zarya"]);

function roleAccent(role: HeroRole | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

function pickAttackTarget(refs: GameRefs, role: HeroRole | undefined, from: { x: number; y: number }, range: number): ActiveEnemy | null {
  const liveEnemies = refs.activeEnemies.filter(
    (enemy) => enemy.alive && enemy.progress >= 0 && isPointInPixiUnitRange(from, enemy, range),
  );
  if (liveEnemies.length === 0) return null;

  if (role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

function getHeroDamage(refs: GameRefs, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase =
    hero.grade === "mythic"
      ? 150
      : hero.grade === "legendary"
        ? 95
        : hero.grade === "epic"
          ? 52
          : hero.grade === "rare"
            ? 28
            : 16;
  const roleMultiplier = role === "damage" ? 1.18 : role === "tank" ? 0.82 : 0.72;
  const fallbackPower = Math.round(gradeBase * roleMultiplier);
  const progressPower = getProgressHeroPower(refs.progressBonuses, hero, fallbackPower);

  return Math.round(
    progressPower *
      refs.progressBonuses.attackMultiplier *
      (1 + refs.state.powerUpgradeLevel * 0.16),
  );
}

function damageEnemy(
  refs: GameRefs,
  enemy: ActiveEnemy,
  damage: number,
  options: PixiCombatRuntimeOptions,
) {
  if (!enemy.alive) return;

  enemy.hp = Math.max(0, enemy.hp - damage);
  updateEnemyViewHp(enemy.view, enemy.hp, enemy.maxHp);

  if (enemy.hp > 0) return;

  enemy.alive = false;

  const reward = applyEconomyRewardBonus(refs.progressBonuses, enemy.reward);
  refs.waveKilled += 1;
  refs.waveReward += reward;
  refs.state = {
    ...refs.state,
    resources: refs.state.resources + reward,
    defeatedEnemies: refs.state.defeatedEnemies + (enemy.boss ? 0 : 1),
    defeatedBosses: refs.state.defeatedBosses + (enemy.boss ? 1 : 0),
    score: refs.state.score + reward * 3 + (enemy.boss ? 250 : 20),
  };

  options.floatText(refs, `+${reward}`, enemy.x, enemy.y - 26, colors.green);
  destroyActiveEnemy(enemy);
  options.invalidateControls(refs);

  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  options.drawTopHud(refs, layout);
  options.drawControls(refs, layout);
}

function applyTankSlow(enemy: ActiveEnemy) {
  enemy.speed = Math.max(0.22, enemy.speed * 0.92);
}

function applySupportSplash(
  refs: GameRefs,
  target: ActiveEnemy,
  damage: number,
  options: PixiCombatRuntimeOptions,
) {
  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.id === target.id) continue;

    if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 72) {
      damageEnemy(refs, enemy, Math.max(1, Math.floor(damage * 0.35)), options);
    }
  }
}

function triggerHeroSpriteAttack(refs: GameRefs, hero: BoardHero, from: { x: number; y: number }, target: ActiveEnemy, options: PixiCombatRuntimeOptions) {
  if (!SPRITE_ATTACK_HERO_IDS.has(hero.heroId)) return;

  refs.heroSpriteAttacks[hero.instanceId] = {
    direction: target.x < from.x ? "left" : "right",
    until: Date.now() + 260,
  };

  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  options.drawBoard(refs, layout);

  window.setTimeout(() => {
    options.drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  }, 280);
}

export function spawnAttackEffects(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  const heroes = getAllBoardHeroes(refs.state.board);
  if (heroes.length === 0) return;

  heroes.slice(0, Math.min(heroes.length, MAX_ATTACKERS_PER_TICK)).forEach((hero, index) => {
    const definition = getHeroById(hero.heroId);
    const role = definition?.role ?? "damage";
    const fromIndex = hero.position.row * refs.state.boardSize.columns + hero.position.column;
    const from = options.getCellCenter(refs, fromIndex);
    const range = getPixiUnitAttackRange(hero);
    const target = pickAttackTarget(refs, role, from, range);
    if (!target) return;

    const damage = getHeroDamage(refs, hero);
    triggerHeroSpriteAttack(refs, hero, from, target, options);

    const projectile = new Graphics();
    projectile.circle(0, 0, hero.grade === "mythic" ? 5 : 3.5);
    projectile.fill({ color: roleAccent(role), alpha: 1 });
    projectile.x = from.x;
    projectile.y = from.y;
    refs.effects.addChild(projectile);

    const targetAtFire = { x: target.x, y: target.y };

    options.addAnimation(refs, {
      duration: 280 + index * 18,
      update: (progress) => {
        const eased = 1 - Math.pow(1 - progress, 2);
        projectile.x = from.x + (targetAtFire.x - from.x) * eased;
        projectile.y = from.y + (targetAtFire.y - from.y) * eased;
        projectile.alpha = 1 - progress * 0.2;
      },
      done: () => {
        projectile.destroy();
        if (!target.alive) return;

        if (role === "tank") applyTankSlow(target);

        damageEnemy(refs, target, damage, options);

        if (role === "support") {
          applySupportSplash(refs, target, damage, options);
        }

        if (index === 0) {
          options.floatText(refs, `${damage}`, target.x, target.y - 18, colors.yellow);
        }
      },
    });
  });
}


export function calculatePixiFirepower(refs: GameRefs) {
  return getAllBoardHeroes(refs.state.board).reduce(
    (sum, hero) => sum + getHeroDamage(refs, hero),
    0,
  );
}
