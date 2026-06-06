import { getAllBoardHeroes, getHeroById } from "@discord-random-defense/game";
import type { BoardHero, HeroRole } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { createGameLayout } from "./gameLayout";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { MAX_ATTACKERS_PER_TICK } from "./pixiGameTypes";
import { updateEnemyViewHp } from "./pixiEnemyView";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { getProgressHeroPower, applyEconomyRewardBonus } from "./pixiProgressBonuses";
import { getHeroLevelMultiplier } from "./pixiLobbyHeroPool";
import { getPixiUnitAttackRange, isPointInPixiUnitRange } from "./pixiUnitRange";
import { chargeMythicUltimateFromAttack, tryTriggerMythicUltimate } from "./pixiUltimateRuntime";
import { applyMythicHeroSkillEffects } from "./pixiSkillRuntime";
import { spawnDistinctHeroAttackFx } from "./pixiHeroAttackFxRuntime";
import { pickWinstonBeamTargets, spawnWinstonElectricBeam } from "./pixiWinstonBeamRuntime";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";

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

const SPRITE_ATTACK_HERO_IDS = new Set(["tracer", "kiriko", "dva", "zarya", "cassidy", "winston", "genji"]);
const ZARYA_MAX_BEAM_CHARGE = 6;
const ZARYA_BEAM_CHAIN_WINDOW_MS = 1200;
let boardDrawQueued = false;
let hudControlsDrawQueued = false;

function requestBoardDraw(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  if (boardDrawQueued) return;
  boardDrawQueued = true;

  window.requestAnimationFrame(() => {
    boardDrawQueued = false;
    options.drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  });
}

function requestHudControlsDraw(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  if (hudControlsDrawQueued) return;
  hudControlsDrawQueued = true;

  window.requestAnimationFrame(() => {
    hudControlsDrawQueued = false;
    const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
    options.drawTopHud(refs, layout);
    options.drawControls(refs, layout);
  });
}

function getHeroSpriteAttackDuration(heroId: string) {
  if (heroId === "cassidy") return 520;
  if (heroId === "zarya") return 620;
  if (heroId === "winston") return 420;
  return 260;
}

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
  const lobbyLevelMultiplier = getHeroLevelMultiplier(refs.heroLevels[hero.heroId] ?? 1);

  return Math.round(
    progressPower *
      lobbyLevelMultiplier *
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
  requestHudControlsDraw(refs, options);
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

  const duration = getHeroSpriteAttackDuration(hero.heroId);

  refs.heroSpriteAttacks[hero.instanceId] = {
    direction: target.x < from.x ? "left" : "right",
    until: Date.now() + duration,
  };

  requestBoardDraw(refs, options);

  window.setTimeout(() => {
    requestBoardDraw(refs, options);
  }, duration + 20);
}

function applyAttackDamage(refs: GameRefs, hero: BoardHero, role: HeroRole, target: ActiveEnemy, damage: number, options: PixiCombatRuntimeOptions) {
  if (!target.alive) return;

  if (role === "tank") applyTankSlow(target);

  damageEnemy(refs, target, damage, options);

  if (role === "support") {
    applySupportSplash(refs, target, damage, options);
  }
}

function updateZaryaBeamCharge(refs: GameRefs, hero: BoardHero, target: ActiveEnemy) {
  const now = Date.now();
  const previous = refs.zaryaBeamCharges[hero.instanceId];
  const isContinuing =
    previous &&
    previous.targetId === target.id &&
    now - previous.lastAttackAt <= ZARYA_BEAM_CHAIN_WINDOW_MS;

  const charge = isContinuing
    ? Math.min(ZARYA_MAX_BEAM_CHARGE, previous.charge + 1)
    : 1;

  refs.zaryaBeamCharges[hero.instanceId] = {
    targetId: target.id,
    charge,
    lastAttackAt: now,
  };

  return charge;
}

function getZaryaBeamDamage(baseDamage: number, charge: number) {
  return Math.round(baseDamage * (0.78 + charge * 0.16));
}

spawnZaryaBeamEffectPLACEHOLDER
