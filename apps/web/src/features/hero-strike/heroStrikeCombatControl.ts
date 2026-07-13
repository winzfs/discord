import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeCombatMode = "drive" | "focus";

type CombatControlRuntime = {
  mode: HeroStrikeCombatMode;
  focusDelay: number;
  lockTargetId: number | null;
  lockRefresh: number;
  pendingUpgrades: number;
};

export const HERO_STRIKE_FOCUS_ENTRY_DELAY = 0.14;
export const HERO_STRIKE_BASE_LOCK_WIDTH = 88;
const runtimeByState = new WeakMap<HeroStrikeState, CombatControlRuntime>();

function createRuntime(): CombatControlRuntime {
  return {
    mode: "drive",
    focusDelay: HERO_STRIKE_FOCUS_ENTRY_DELAY,
    lockTargetId: null,
    lockRefresh: 0,
    pendingUpgrades: 0,
  };
}

export function resetHeroStrikeCombatControl(state: HeroStrikeState) {
  runtimeByState.set(state, createRuntime());
}

export function getHeroStrikeCombatControl(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime) {
    runtime = createRuntime();
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function prepareHeroStrikeCombatStage(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  runtime.mode = "drive";
  runtime.focusDelay = HERO_STRIKE_FOCUS_ENTRY_DELAY;
  runtime.lockTargetId = null;
  runtime.lockRefresh = 0;
}

export function beginHeroStrikeDrive(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  runtime.mode = "drive";
  runtime.focusDelay = HERO_STRIKE_FOCUS_ENTRY_DELAY;
  runtime.lockTargetId = null;
  runtime.lockRefresh = 0;
}

export function releaseHeroStrikeFocus(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  runtime.mode = "drive";
  runtime.focusDelay = HERO_STRIKE_FOCUS_ENTRY_DELAY;
  runtime.lockTargetId = null;
  runtime.lockRefresh = 0;
  state.player.targetX = state.player.x;
  state.player.targetY = state.player.y;
}

function getLockWidth(state: HeroStrikeState) {
  return HERO_STRIKE_BASE_LOCK_WIDTH
    + Math.min(44, (state.player.pierce + state.player.chainCoreLevel) * 8);
}

function targetPriority(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  const horizontal = Math.abs(enemy.x - state.player.x);
  const vertical = Math.max(0, state.player.y - enemy.y);
  const priorityBonus = enemy.boss ? 150 : enemy.elite ? 85 : enemy.kind === "sniper" ? 32 : 0;
  return horizontal * 2.3 + vertical * 0.12 - priorityBonus;
}

function chooseLockTarget(state: HeroStrikeState) {
  const lockWidth = getLockWidth(state);
  let best: HeroStrikeEnemy | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.y >= state.player.y - 18) continue;
    if (Math.abs(enemy.x - state.player.x) > lockWidth) continue;
    const score = targetPriority(state, enemy);
    if (score >= bestScore) continue;
    best = enemy;
    bestScore = score;
  }
  return best;
}

export function updateHeroStrikeCombatControl(state: HeroStrikeState, dt: number) {
  const runtime = getHeroStrikeCombatControl(state);
  if (state.pointerActive) {
    runtime.mode = "drive";
    runtime.focusDelay = HERO_STRIKE_FOCUS_ENTRY_DELAY;
    runtime.lockTargetId = null;
    return;
  }

  if (runtime.focusDelay > 0) {
    runtime.focusDelay = Math.max(0, runtime.focusDelay - dt);
    if (runtime.focusDelay <= 0) {
      runtime.mode = "focus";
      runtime.lockRefresh = 0;
    }
  }

  if (runtime.mode !== "focus") return;
  runtime.lockRefresh -= dt;
  if (runtime.lockRefresh > 0) return;
  runtime.lockRefresh = 0.055;
  runtime.lockTargetId = chooseLockTarget(state)?.id ?? null;
}

export function getHeroStrikeCombatMode(state: HeroStrikeState) {
  return getHeroStrikeCombatControl(state).mode;
}

export function isHeroStrikeFocus(state: HeroStrikeState) {
  return getHeroStrikeCombatControl(state).mode === "focus";
}

export function getHeroStrikeFocusProgress(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  if (runtime.mode === "focus") return 1;
  return Math.max(0, Math.min(1, 1 - runtime.focusDelay / HERO_STRIKE_FOCUS_ENTRY_DELAY));
}

export function getHeroStrikeLockWidth(state: HeroStrikeState) {
  return getLockWidth(state);
}

export function getHeroStrikeLockTarget(state: HeroStrikeState) {
  const targetId = getHeroStrikeCombatControl(state).lockTargetId;
  return targetId === null
    ? null
    : state.enemies.find((enemy) => enemy.id === targetId && !enemy.dead) ?? null;
}

export function getHeroStrikeAimAngle(state: HeroStrikeState) {
  if (!isHeroStrikeFocus(state)) return 0;
  const target = getHeroStrikeLockTarget(state);
  if (!target) return 0;
  const dx = target.x - state.player.x;
  const dy = Math.max(48, state.player.y - target.y);
  return Math.max(-0.38, Math.min(0.38, Math.atan2(dx, dy)));
}

export function getHeroStrikePrimaryDamageScale(_state: HeroStrikeState) {
  return 1;
}

export function getHeroStrikeSupportDamageScale(_state: HeroStrikeState) {
  return 1;
}

export function getHeroStrikeSupportIntervalScale(_state: HeroStrikeState) {
  return 1;
}

export function getHeroStrikePrimaryIntervalScale(_state: HeroStrikeState) {
  return 1;
}

export function getHeroStrikeMovementResponseScale(state: HeroStrikeState) {
  return isHeroStrikeFocus(state) ? 0.42 : 1.12;
}

export function queueHeroStrikeUpgrade(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  runtime.pendingUpgrades = Math.min(2, runtime.pendingUpgrades + 1);
}

export function getPendingHeroStrikeUpgrades(state: HeroStrikeState) {
  return getHeroStrikeCombatControl(state).pendingUpgrades;
}

export function consumePendingHeroStrikeUpgrade(state: HeroStrikeState) {
  const runtime = getHeroStrikeCombatControl(state);
  if (runtime.pendingUpgrades <= 0) return false;
  runtime.pendingUpgrades -= 1;
  return true;
}
