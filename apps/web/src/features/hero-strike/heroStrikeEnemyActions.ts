import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addBurst, addRing } from "./heroStrikeEffects";
import {
  getHeroStrikeEnemyBulletSpeed,
} from "./heroStrikeEnemyFire";
import { spawnHeroStrikeEnemyBullet } from "./heroStrikeEnemyProjectiles";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import type {
  HeroStrikeEnemyActionKind,
  HeroStrikeEnemyActionRuntime,
} from "./heroStrikeEnemyActionTypes";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

const runtimeByEnemy = new WeakMap<HeroStrikeEnemy, HeroStrikeEnemyActionRuntime>();

function actionKindFor(enemy: HeroStrikeEnemy): HeroStrikeEnemyActionKind | null {
  if (enemy.kind === "runner") return "runner-dash";
  if (enemy.kind === "sniper") return "sniper-shot";
  if (enemy.kind === "bomber") return "bomber-blast";
  return null;
}

function initialDelay(kind: HeroStrikeEnemyActionKind) {
  if (kind === "runner-dash") return 0.9 + Math.random() * 0.55;
  if (kind === "sniper-shot") return 1.05 + Math.random() * 0.55;
  return 1.25 + Math.random() * 0.65;
}

function createRuntime(enemy: HeroStrikeEnemy): HeroStrikeEnemyActionRuntime | null {
  const kind = actionKindFor(enemy);
  if (!kind) return null;
  const timer = initialDelay(kind);
  return {
    kind,
    phase: "position",
    timer,
    phaseDuration: timer,
    targetX: enemy.x,
    targetY: enemy.y,
    dashVx: 0,
    dashVy: 0,
    sequence: 0,
  };
}

export function isHeroStrikeEnemyActionManaged(enemy: HeroStrikeEnemy) {
  return !enemy.boss && actionKindFor(enemy) !== null;
}

export function getHeroStrikeEnemyAction(enemy: HeroStrikeEnemy) {
  if (!isHeroStrikeEnemyActionManaged(enemy)) return null;
  let runtime = runtimeByEnemy.get(enemy);
  if (!runtime) {
    runtime = createRuntime(enemy) ?? undefined;
    if (runtime) runtimeByEnemy.set(enemy, runtime);
  }
  return runtime ?? null;
}

function activationY(enemy: HeroStrikeEnemy) {
  if (enemy.kind === "runner") return 108;
  if (enemy.kind === "sniper") return 142;
  return 128;
}

function telegraphScale(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const difficultyScale = state.loadout.difficulty === "recruit"
    ? 1.16
    : state.loadout.difficulty === "legend"
      ? 0.88
      : 1;
  const eliteScale = enemy.eliteTrait === "rapid" ? 0.82 : enemy.eliteTrait === "veteran" ? 0.92 : 1;
  const stageScale = Math.max(0.84, 1 - state.stageIndex * 0.012);
  return difficultyScale * eliteScale * stageScale / Math.max(0.9, difficulty.enemyBulletSpeed);
}

function nextPositionDelay(state: HeroStrikeState, runtime: HeroStrikeEnemyActionRuntime) {
  const stageReduction = Math.min(0.42, state.stageIndex * 0.035);
  if (runtime.kind === "runner-dash") return Math.max(0.8, 1.65 - stageReduction + Math.random() * 0.45);
  if (runtime.kind === "sniper-shot") return Math.max(0.72, 1.45 - stageReduction + Math.random() * 0.4);
  return Math.max(0.9, 1.75 - stageReduction + Math.random() * 0.5);
}

function predictPlayerTarget(state: HeroStrikeState, lead: number) {
  const player = state.player;
  const velocityX = player.targetX - player.x;
  const velocityY = player.targetY - player.y;
  return {
    x: Math.max(24, Math.min(HERO_STRIKE_WIDTH - 24, player.x + velocityX * lead)),
    y: Math.max(330, Math.min(HERO_STRIKE_HEIGHT - 48, player.y + velocityY * lead)),
  };
}

function beginTelegraph(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  runtime: HeroStrikeEnemyActionRuntime,
) {
  const scale = telegraphScale(state, enemy);
  const target = runtime.kind === "runner-dash"
    ? predictPlayerTarget(state, 0.65)
    : runtime.kind === "sniper-shot"
      ? predictPlayerTarget(state, 0.22)
      : predictPlayerTarget(state, 0.38);

  runtime.targetX = target.x;
  runtime.targetY = target.y;
  runtime.phase = "telegraph";
  runtime.sequence += 1;
  runtime.phaseDuration = runtime.kind === "runner-dash"
    ? 0.48 * scale
    : runtime.kind === "sniper-shot"
      ? 0.76 * scale
      : 0.92 * scale;
  runtime.timer = runtime.phaseDuration;
}

function beginRunnerAttack(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  runtime: HeroStrikeEnemyActionRuntime,
) {
  const dx = runtime.targetX - enemy.x;
  const dy = runtime.targetY - enemy.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const speed = 335 + state.stageIndex * 9;
  runtime.dashVx = dx / length * speed;
  runtime.dashVy = dy / length * speed;
  runtime.phaseDuration = 0.58;
  runtime.timer = runtime.phaseDuration;
  state.shake = Math.max(state.shake, 0.12);
  addRing(state, enemy.x, enemy.y, HERO_STRIKE_COLORS.red, 16);
}

function beginSniperAttack(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  runtime: HeroStrikeEnemyActionRuntime,
) {
  const angle = Math.atan2(runtime.targetY - enemy.y, runtime.targetX - enemy.x);
  const speed = getHeroStrikeEnemyBulletSpeed(state)
    * (enemy.eliteTrait === "rapid" || enemy.eliteTrait === "veteran" ? 1.92 : 1.72);
  spawnHeroStrikeEnemyBullet(state, enemy, angle, speed, {
    radius: 4.2,
    variant: "needle",
  });
  runtime.phaseDuration = 0.14;
  runtime.timer = runtime.phaseDuration;
  enemy.recoilY += -18;
  state.shake = Math.max(state.shake, 0.08);
}

function beginBomberAttack(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  runtime: HeroStrikeEnemyActionRuntime,
) {
  const blastRadius = enemy.elite ? 50 : 42;
  spawnHeroStrikeEnemyBullet(state, enemy, 0, 0, {
    originX: runtime.targetX,
    originY: runtime.targetY,
    radius: blastRadius,
    variant: "heavy",
    life: 0.13,
  });
  addRing(state, runtime.targetX, runtime.targetY, HERO_STRIKE_COLORS.red, blastRadius * 0.72);
  addBurst(state, runtime.targetX, runtime.targetY, HERO_STRIKE_COLORS.red, enemy.elite ? 18 : 12, 160, 3.4);
  runtime.phaseDuration = 0.18;
  runtime.timer = runtime.phaseDuration;
  enemy.recoilY += -22;
  state.shake = Math.max(state.shake, enemy.elite ? 0.36 : 0.22);
}

function beginAttack(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  runtime: HeroStrikeEnemyActionRuntime,
) {
  runtime.phase = "attack";
  if (runtime.kind === "runner-dash") beginRunnerAttack(state, enemy, runtime);
  else if (runtime.kind === "sniper-shot") beginSniperAttack(state, enemy, runtime);
  else beginBomberAttack(state, enemy, runtime);
}

function beginRecover(runtime: HeroStrikeEnemyActionRuntime) {
  runtime.phase = "recover";
  runtime.phaseDuration = runtime.kind === "runner-dash"
    ? 0.82
    : runtime.kind === "sniper-shot"
      ? 0.94
      : 1.18;
  runtime.timer = runtime.phaseDuration;
}

function beginPosition(state: HeroStrikeState, runtime: HeroStrikeEnemyActionRuntime) {
  runtime.phase = "position";
  runtime.phaseDuration = nextPositionDelay(state, runtime);
  runtime.timer = runtime.phaseDuration;
  runtime.dashVx = 0;
  runtime.dashVy = 0;
}

export function updateHeroStrikeEnemyAction(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  dt: number,
) {
  const runtime = getHeroStrikeEnemyAction(enemy);
  if (!runtime) return false;
  if (enemy.dead || enemy.y < activationY(enemy)) return true;

  runtime.timer = Math.max(0, runtime.timer - dt);
  if (runtime.timer > 0) return true;

  if (runtime.phase === "position") beginTelegraph(state, enemy, runtime);
  else if (runtime.phase === "telegraph") beginAttack(state, enemy, runtime);
  else if (runtime.phase === "attack") beginRecover(runtime);
  else beginPosition(state, runtime);
  return true;
}

export function getHeroStrikeEnemyTelegraphProgress(enemy: HeroStrikeEnemy) {
  const runtime = getHeroStrikeEnemyAction(enemy);
  if (!runtime || runtime.phase !== "telegraph") return 0;
  if (runtime.phaseDuration <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - runtime.timer / runtime.phaseDuration));
}

export function applyHeroStrikeEnemyActionMovement(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  dt: number,
) {
  const runtime = getHeroStrikeEnemyAction(enemy);
  if (!runtime) return false;

  if (enemy.y < activationY(enemy)) {
    enemy.y += enemy.vy * dt;
  } else if (runtime.kind === "runner-dash") {
    if (runtime.phase === "attack") {
      enemy.x += runtime.dashVx * dt;
      enemy.y += runtime.dashVy * dt;
    } else if (runtime.phase === "telegraph") {
      enemy.x += Math.sin(enemy.age * 9 + enemy.phase) * 5 * dt;
    } else {
      enemy.x += Math.sin(enemy.age * 4.4 + enemy.phase) * 24 * dt;
      enemy.y += (runtime.phase === "recover" ? 14 : 24) * dt;
    }
  } else if (runtime.kind === "sniper-shot") {
    const hoverY = 154 + Math.sin(enemy.phase) * 26;
    if (enemy.y < hoverY) enemy.y += enemy.vy * dt;
    else if (runtime.phase === "position" || runtime.phase === "recover") {
      enemy.x += Math.sin(enemy.age * 1.8 + enemy.phase) * 38 * dt;
    }
  } else {
    if (runtime.phase === "position" || runtime.phase === "recover") {
      enemy.x += Math.sin(enemy.age * 1.25 + enemy.phase) * 15 * dt;
      enemy.y += enemy.vy * 0.34 * dt;
    }
  }

  enemy.x += enemy.recoilX * dt;
  enemy.y += enemy.recoilY * dt;
  enemy.x = Math.max(enemy.radius, Math.min(HERO_STRIKE_WIDTH - enemy.radius, enemy.x));
  return true;
}
