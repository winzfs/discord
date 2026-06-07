import {
  getAllBoardHeroes,
  getHeroById,
  getHeroTacticalAttackIntervalMultiplier,
  getHeroTargetPriority,
} from "@discord-random-defense/game";
import type { BoardHero, HeroRole, HeroTargetPriority } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { createGameLayout } from "./gameLayout";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { updateEnemyViewHp } from "./pixiEnemyView";
import { destroyActiveEnemy } from "./pixiEnemyRuntime";
import { getProgressHeroPower, applyEconomyRewardBonus } from "./pixiProgressBonuses";
import { getHeroLevelMultiplier } from "./pixiLobbyHeroPool";
import { getHeroSynergyAttackMultiplier, getHeroSynergyLabel } from "./pixiHeroSynergyRuntime";
import { getPixiUnitAttackRange, isPointInPixiUnitRange } from "./pixiUnitRange";
import { chargeMythicUltimateFromAttack, getAttackIntervalMultiplier, tryTriggerMythicUltimate } from "./pixiUltimateRuntime";
import { applyMythicHeroSkillEffects } from "./pixiSkillRuntime";
import { spawnDistinctHeroAttackFx } from "./pixiHeroAttackFxRuntime";
import { pickWinstonBeamTargets, spawnWinstonElectricBeam } from "./pixiWinstonBeamRuntime";
import { acquireFxGraphics, releaseFxGraphics } from "./pixiFxPoolRuntime";
import { spawnBaseSkillFx } from "./pixiBaseSkillFxRuntime";
import {
  applyBaseHeroSkillPostDamage,
  applyBaseHeroSkillPreDamage,
  getBaseHeroSkillFxKind,
} from "./pixiBaseHeroSkillRuntime";

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

const SPRITE_ATTACK_HERO_IDS = new Set([
  "spark-runner",
  "rookie-guard",
  "mini-mender",
  "scrap-gunner",
  "slow-bot",
  "charge-helper",
  "pulse-ranger",
  "barrier-guard",
  "field-medic",
  "tracer",
  "kiriko",
  "dva",
  "zarya",
  "cassidy",
  "winston",
  "genji",
  "ana",
  "illari",
]);
const HERO_IDLE_DIRECTION_HOLD_MS = 3000;
const HERO_BASE_ATTACK_INTERVAL_SECONDS = 0.48;
const HERO_MIN_ATTACK_INTERVAL_SECONDS = 0.12;
const ZARYA_MAX_BEAM_CHARGE = 6;
const ZARYA_BEAM_CHAIN_WINDOW_MS = 1200;
const BOSS_LUCK_STONE_REWARD = 1;
const STACK_ATTACK_OFFSETS = [
  { x: 0, y: -5 },
  { x: -7, y: 5 },
  { x: 7, y: 5 },
];
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

function getHeroCellIndex(refs: GameRefs, hero: BoardHero) {
  return hero.position.row * refs.state.boardSize.columns + hero.position.column;
}

function getHeroStackIndex(refs: GameRefs, hero: BoardHero) {
  const cell = refs.state.board[getHeroCellIndex(refs, hero)];
  const index = cell?.units.findIndex((unit) => unit.instanceId === hero.instanceId) ?? -1;
  return index >= 0 ? index : 0;
}

function getStackedAttackOrigin(refs: GameRefs, hero: BoardHero, center: { x: number; y: number; cell: number }) {
  const stackIndex = getHeroStackIndex(refs, hero);
  const offset = STACK_ATTACK_OFFSETS[stackIndex % STACK_ATTACK_OFFSETS.length] ?? STACK_ATTACK_OFFSETS[0];
  return {
    x: center.x + offset.x,
    y: center.y + offset.y,
    cell: center.cell,
  };
}

function sortTargetsByPriority(targets: ActiveEnemy[], priority: HeroTargetPriority) {
  const ordered = [...targets];

  if (priority === "boss") {
    ordered.sort((a, b) => Number(b.boss) - Number(a.boss) || b.hp - a.hp || b.progress - a.progress);
    return ordered;
  }

  if (priority === "highest-hp") {
    ordered.sort((a, b) => b.hp - a.hp || b.progress - a.progress);
    return ordered;
  }

  if (priority === "low-hp") {
    ordered.sort((a, b) => a.hp - b.hp || b.progress - a.progress);
    return ordered;
  }

  if (priority === "cluster") {
    ordered.sort((a, b) => countNearbyTargets(targets, b) - countNearbyTargets(targets, a) || b.progress - a.progress);
    return ordered;
  }

  ordered.sort((a, b) => b.progress - a.progress);
  return ordered;
}

function countNearbyTargets(targets: ActiveEnemy[], target: ActiveEnemy) {
  return targets.filter((enemy) => enemy.id !== target.id && Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 76).length;
}

function pickAttackTarget(refs: GameRefs, heroId: string, role: HeroRole | undefined, from: { x: number; y: number }, range: number): ActiveEnemy | null {
  const liveEnemies = refs.activeEnemies.filter(
    (enemy) => enemy.alive && enemy.progress >= 0 && isPointInPixiUnitRange(from, enemy, range),
  );
  if (liveEnemies.length === 0) return null;

  const priority = getHeroTargetPriority(heroId);
  const orderedTargets = sortTargetsByPriority(liveEnemies, priority);

  if (priority === "front" && role === "damage") {
    const boss = orderedTargets.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  return orderedTargets[0] ?? null;
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
  const roleMultiplier = role === "damage" ? 1.35 : role === "tank" ? 0.62 : 0.48;
  const fallbackPower = Math.round(gradeBase * roleMultiplier);
  const progressPower = getProgressHeroPower(refs.progressBonuses, hero, fallbackPower);
  const lobbyLevelMultiplier = getHeroLevelMultiplier(refs.heroLevels[hero.heroId] ?? 1);
  const synergyMultiplier = getHeroSynergyAttackMultiplier(refs, hero);

  return Math.round(
    progressPower *
      lobbyLevelMultiplier *
      refs.progressBonuses.attackMultiplier *
      synergyMultiplier *
      (1 + refs.state.powerUpgradeLevel * 0.16),
  );
}

function getHeroAttackIntervalSeconds(refs: GameRefs, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const attackSpeed = Math.max(0.1, definition?.attackSpeed ?? 1);
  const globalMultiplier = getAttackIntervalMultiplier(refs);
  const tacticalMultiplier = getHeroTacticalAttackIntervalMultiplier(hero.heroId);
  return Math.max(HERO_MIN_ATTACK_INTERVAL_SECONDS, (HERO_BASE_ATTACK_INTERVAL_SECONDS / attackSpeed) * globalMultiplier * tacticalMultiplier);
}

function cleanupHeroAttackCooldowns(refs: GameRefs, heroes: BoardHero[]) {
  const aliveHeroIds = new Set(heroes.map((hero) => hero.instanceId));
  Object.keys(refs.heroAttackCooldowns).forEach((instanceId) => {
    if (!aliveHeroIds.has(instanceId)) delete refs.heroAttackCooldowns[instanceId];
  });
}

function tickHeroAttackCooldown(refs: GameRefs, hero: BoardHero, deltaSeconds: number) {
  const nextCooldown = Math.max(0, (refs.heroAttackCooldowns[hero.instanceId] ?? 0) - deltaSeconds);
  refs.heroAttackCooldowns[hero.instanceId] = nextCooldown;
  return nextCooldown <= 0;
}

function resetHeroAttackCooldown(refs: GameRefs, hero: BoardHero) {
  refs.heroAttackCooldowns[hero.instanceId] = getHeroAttackIntervalSeconds(refs, hero);
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
  const luckStoneReward = enemy.boss ? BOSS_LUCK_STONE_REWARD : 0;
  refs.waveKilled += 1;
  refs.waveReward += reward;
  refs.state = {
    ...refs.state,
    resources: refs.state.resources + reward,
    luckStones: refs.state.luckStones + luckStoneReward,
    defeatedEnemies: refs.state.defeatedEnemies + (enemy.boss ? 0 : 1),
    defeatedBosses: refs.state.defeatedBosses + (enemy.boss ? 1 : 0),
    score: refs.state.score + reward * 3 + (enemy.boss ? 250 : 20),
  };

  options.floatText(refs, `+${reward}`, enemy.x, enemy.y - 26, colors.green);
  if (luckStoneReward > 0) {
    options.floatText(refs, `행운석 +${luckStoneReward}`, enemy.x, enemy.y - 46, colors.blue);
  }
  destroyActiveEnemy(enemy);
  options.invalidateControls(refs);
  requestHudControlsDraw(refs, options);
}

function applyTankSlow(enemy: ActiveEnemy) {
  enemy.speed = Math.max(0.2, enemy.speed * 0.88);
}

function triggerHeroSpriteAttack(refs: GameRefs, hero: BoardHero, from: { x: number; y: number }, target: ActiveEnemy, options: PixiCombatRuntimeOptions) {
  if (!SPRITE_ATTACK_HERO_IDS.has(hero.heroId)) return;

  const now = Date.now();
  const direction = target.x < from.x ? "left" : "right";
  const duration = getHeroSpriteAttackDuration(hero.heroId);

  refs.heroSpriteAttacks[hero.instanceId] = {
    direction,
    until: now + duration,
    idleUntil: now + HERO_IDLE_DIRECTION_HOLD_MS,
  };

  requestBoardDraw(refs, options);

  window.setTimeout(() => {
    requestBoardDraw(refs, options);
  }, duration + 20);

  window.setTimeout(() => {
    requestBoardDraw(refs, options);
  }, HERO_IDLE_DIRECTION_HOLD_MS + 20);
}

function showBaseSkillStartupFx(refs: GameRefs, hero: BoardHero, role: HeroRole, target: ActiveEnemy, options: PixiCombatRuntimeOptions) {
  const fxKind = getBaseHeroSkillFxKind(hero, role);
  if (!fxKind) return;

  spawnBaseSkillFx(
    refs,
    { addAnimation: options.addAnimation },
    fxKind,
    target,
  );
}

function applyBaseHeroPostDamage(
  refs: GameRefs,
  hero: BoardHero,
  role: HeroRole,
  target: ActiveEnemy,
  damage: number,
  options: PixiCombatRuntimeOptions,
) {
  applyBaseHeroSkillPostDamage(
    refs,
    {
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
      floatText: options.floatText,
      addAnimation: options.addAnimation,
    },
    hero,
    role,
    target,
    damage,
  );
}

function applyAttackDamage(refs: GameRefs, hero: BoardHero, role: HeroRole, target: ActiveEnemy, damage: number, options: PixiCombatRuntimeOptions) {
  if (!target.alive) return;

  if (role === "tank") applyTankSlow(target);

  damageEnemy(refs, target, damage, options);
  applyBaseHeroPostDamage(refs, hero, role, target, damage, options);
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

function spawnZaryaBeamEffect(
  refs: GameRefs,
  options: PixiCombatRuntimeOptions,
  from: { x: number; y: number },
  target: ActiveEnemy,
  charge: number,
  done: () => void,
) {
  const beam = acquireFxGraphics(refs);
  const duration = 620;
  const baseOuterWidth = 7 + charge * 1.9;
  const baseInnerWidth = 2.5 + charge * 0.7;

  options.addAnimation(refs, {
    duration,
    update: (progress) => {
      if (!target.alive) {
        beam.alpha = Math.max(0, 1 - progress);
        return;
      }

      const pulse = 0.72 + Math.sin(progress * Math.PI * 8) * 0.18;
      const alpha = 0.92 - progress * 0.18;
      const outerWidth = baseOuterWidth * pulse;
      const innerWidth = baseInnerWidth * (0.9 + pulse * 0.12);

      beam.clear();
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xff4fd8, width: outerWidth, alpha: 0.28 * alpha });
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xff9ff1, width: Math.max(3, outerWidth * 0.52), alpha: 0.32 * alpha });
      beam.moveTo(from.x, from.y);
      beam.lineTo(target.x, target.y);
      beam.stroke({ color: 0xffffff, width: innerWidth, alpha });
    },
    done: () => {
      releaseFxGraphics(refs, beam);
      done();
    },
  });
}

function tryTriggerUltimateAttack(refs: GameRefs, options: PixiCombatRuntimeOptions, hero: BoardHero, from: { x: number; y: number }, target: ActiveEnemy, damage: number) {
  chargeMythicUltimateFromAttack(refs, hero);

  const triggered = tryTriggerMythicUltimate(
    refs,
    {
      addAnimation: options.addAnimation,
      floatText: options.floatText,
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
    },
    hero,
    from,
    target,
    damage,
  );

  requestBoardDraw(refs, options);
  return triggered;
}

function drawBoardNow(refs: GameRefs, options: PixiCombatRuntimeOptions) {
  requestBoardDraw(refs, options);
}

function applySkillEffects(refs: GameRefs, options: PixiCombatRuntimeOptions, hero: BoardHero, role: HeroRole, target: ActiveEnemy, damage: number, from: { x: number; y: number }) {
  return applyMythicHeroSkillEffects(
    refs,
    {
      addAnimation: options.addAnimation,
      damageEnemy: (refs, enemy, damage) => damageEnemy(refs, enemy, damage, options),
      drawBoard: (refs) => drawBoardNow(refs, options),
      floatText: options.floatText,
    },
    hero,
    role,
    target,
    damage,
    from,
  );
}

export function spawnAttackEffects(refs: GameRefs, options: PixiCombatRuntimeOptions, deltaSeconds = 0.016) {
