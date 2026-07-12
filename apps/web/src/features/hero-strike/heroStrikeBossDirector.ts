import { HERO_STRIKE_BOSS_Y } from "./heroStrikeConfig";
import { fireHeroStrikeEnemyPattern } from "./heroStrikeEnemyFire";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import { getCurrentHeroStrikeStage, type BossBulletPattern } from "./heroStrikeStages";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeBossActionPhase =
  | "guard"
  | "telegraph"
  | "attack"
  | "exposed"
  | "recover";

type HeroStrikeBossRuntime = {
  phase: HeroStrikeBossActionPhase;
  timer: number;
  duration: number;
  sequence: number;
  bossPhase: number;
  pattern: BossBulletPattern;
  targetX: number;
  targetY: number;
};

const runtimeByBoss = new WeakMap<HeroStrikeEnemy, HeroStrikeBossRuntime>();

function patternLabel(pattern: BossBulletPattern) {
  if (pattern === "fan") return "SECTOR BARRAGE";
  if (pattern === "petals") return "PETAL RING";
  if (pattern === "spiral") return "SPIRAL DRIVE";
  if (pattern === "lanes") return "LANE SUPPRESSION";
  if (pattern === "burst") return "CORE BURST";
  return "HYBRID ASSAULT";
}

function createRuntime(state: HeroStrikeState, boss: HeroStrikeEnemy): HeroStrikeBossRuntime {
  return {
    phase: "guard",
    timer: 0.9,
    duration: 0.9,
    sequence: 0,
    bossPhase: boss.bossPhase ?? 1,
    pattern: getCurrentHeroStrikeStage(state).bossPattern,
    targetX: state.player.x,
    targetY: state.player.y,
  };
}

function getRuntime(state: HeroStrikeState, boss: HeroStrikeEnemy) {
  let runtime = runtimeByBoss.get(boss);
  if (!runtime) {
    runtime = createRuntime(state, boss);
    runtimeByBoss.set(boss, runtime);
  }
  return runtime;
}

function beginGuard(runtime: HeroStrikeBossRuntime, bossPhase: number) {
  runtime.phase = "guard";
  runtime.duration = bossPhase >= 3 ? 0.48 : bossPhase >= 2 ? 0.62 : 0.78;
  runtime.timer = runtime.duration;
}

function beginTelegraph(state: HeroStrikeState, boss: HeroStrikeEnemy, runtime: HeroStrikeBossRuntime) {
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const difficultyScale = state.loadout.difficulty === "recruit"
    ? 1.18
    : state.loadout.difficulty === "legend"
      ? 0.86
      : 1;
  runtime.phase = "telegraph";
  runtime.sequence += 1;
  runtime.pattern = getCurrentHeroStrikeStage(state).bossPattern;
  runtime.targetX = state.player.x;
  runtime.targetY = state.player.y;
  runtime.duration = (runtime.bossPhase >= 3 ? 0.58 : 0.74)
    * difficultyScale
    / Math.max(0.9, difficulty.enemyBulletSpeed);
  runtime.timer = runtime.duration;
  boss.fireCooldown = Math.max(boss.fireCooldown, runtime.duration);
}

function beginAttack(state: HeroStrikeState, boss: HeroStrikeEnemy, runtime: HeroStrikeBossRuntime) {
  runtime.phase = "attack";
  runtime.duration = 0.16;
  runtime.timer = runtime.duration;
  fireHeroStrikeEnemyPattern(state, boss);
  state.shake = Math.max(state.shake, 0.26);
}

function beginExposed(runtime: HeroStrikeBossRuntime) {
  runtime.phase = "exposed";
  runtime.duration = runtime.bossPhase >= 3 ? 0.58 : 0.82;
  runtime.timer = runtime.duration;
}

function beginRecover(runtime: HeroStrikeBossRuntime) {
  runtime.phase = "recover";
  runtime.duration = 0.42;
  runtime.timer = runtime.duration;
}

export function updateHeroStrikeBossDirector(
  state: HeroStrikeState,
  boss: HeroStrikeEnemy,
  dt: number,
) {
  if (!boss.boss || boss.dead) return false;
  const runtime = getRuntime(state, boss);
  if (boss.y < HERO_STRIKE_BOSS_Y - 2) return true;

  const bossPhase = boss.bossPhase ?? 1;
  if (runtime.bossPhase !== bossPhase) {
    runtime.bossPhase = bossPhase;
    runtime.pattern = getCurrentHeroStrikeStage(state).bossPattern;
    beginGuard(runtime, bossPhase);
    return true;
  }

  const breakStun = boss.breakStun ?? 0;
  if (breakStun > 0) {
    runtime.phase = "exposed";
    runtime.duration = Math.max(runtime.duration, breakStun);
    runtime.timer = breakStun;
    return true;
  }

  runtime.timer = Math.max(0, runtime.timer - dt);
  if (runtime.timer > 0) return true;

  if (runtime.phase === "guard") beginTelegraph(state, boss, runtime);
  else if (runtime.phase === "telegraph") beginAttack(state, boss, runtime);
  else if (runtime.phase === "attack") beginExposed(runtime);
  else if (runtime.phase === "exposed") beginRecover(runtime);
  else beginGuard(runtime, bossPhase);
  return true;
}

export function getHeroStrikeBossActionSnapshot(
  state: HeroStrikeState,
  boss: HeroStrikeEnemy,
) {
  const runtime = getRuntime(state, boss);
  return {
    phase: runtime.phase,
    pattern: runtime.pattern,
    patternLabel: patternLabel(runtime.pattern),
    progress: runtime.duration > 0
      ? Math.max(0, Math.min(1, 1 - runtime.timer / runtime.duration))
      : 1,
    targetX: runtime.targetX,
    targetY: runtime.targetY,
    sequence: runtime.sequence,
  };
}

export function getHeroStrikeBossActionDamageMultiplier(boss: HeroStrikeEnemy) {
  if ((boss.breakStun ?? 0) > 0) return 1;
  const phase = runtimeByBoss.get(boss)?.phase;
  if (phase === "exposed") return 1.22;
  if (phase === "guard") return 0.78;
  return 1;
}

export function getHeroStrikeBossBreakPressureMultiplier(
  state: HeroStrikeState,
  boss: HeroStrikeEnemy,
) {
  const phase = getRuntime(state, boss).phase;
  if (phase === "exposed") return 1.35;
  if (phase === "guard") return 0.62;
  return 1;
}
