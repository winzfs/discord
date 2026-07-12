import type { HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeCombatGrade = "D" | "C" | "B" | "A" | "S";

type HeroStrikeCombatRankRuntime = {
  points: number;
  peakPoints: number;
  totalPoints: number;
  sampleTime: number;
  inactivity: number;
  lastKills: number;
  lastHits: number;
  lastBossBreaks: number;
  lastStageIndex: number;
  lastStageGrazes: number;
};

const runtimeByState = new WeakMap<HeroStrikeState, HeroStrikeCombatRankRuntime>();

function createRuntime(state: HeroStrikeState): HeroStrikeCombatRankRuntime {
  return {
    points: 35,
    peakPoints: 35,
    totalPoints: 0,
    sampleTime: 0,
    inactivity: 0,
    lastKills: state.kills,
    lastHits: state.hitsTaken,
    lastBossBreaks: state.bossBreaks,
    lastStageIndex: state.stageIndex,
    lastStageGrazes: state.stageGrazes,
  };
}

export function resetHeroStrikeCombatRank(state: HeroStrikeState) {
  runtimeByState.set(state, createRuntime(state));
}

function getRuntime(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime) {
    runtime = createRuntime(state);
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

function addPoints(state: HeroStrikeState, amount: number) {
  const runtime = getRuntime(state);
  runtime.points = Math.max(0, Math.min(100, runtime.points + amount));
  runtime.peakPoints = Math.max(runtime.peakPoints, runtime.points);
  if (amount > 0) runtime.inactivity = 0;
}

export function recordHeroStrikeCombatRankMission(state: HeroStrikeState, succeeded: boolean) {
  addPoints(state, succeeded ? 9 : -12);
}

export function updateHeroStrikeCombatRank(state: HeroStrikeState, dt: number) {
  const runtime = getRuntime(state);

  const killDelta = Math.max(0, state.kills - runtime.lastKills);
  const hitDelta = Math.max(0, state.hitsTaken - runtime.lastHits);
  const breakDelta = Math.max(0, state.bossBreaks - runtime.lastBossBreaks);
  if (killDelta > 0) addPoints(state, killDelta * 0.9);
  if (hitDelta > 0) addPoints(state, hitDelta * -19);
  if (breakDelta > 0) addPoints(state, breakDelta * 10);
  runtime.lastKills = state.kills;
  runtime.lastHits = state.hitsTaken;
  runtime.lastBossBreaks = state.bossBreaks;

  if (runtime.lastStageIndex !== state.stageIndex) {
    runtime.lastStageIndex = state.stageIndex;
    runtime.lastStageGrazes = state.stageGrazes;
  }
  const grazeDelta = Math.max(0, state.stageGrazes - runtime.lastStageGrazes);
  if (grazeDelta > 0) addPoints(state, grazeDelta * 1.6);
  runtime.lastStageGrazes = state.stageGrazes;

  runtime.inactivity += dt;
  if (runtime.inactivity > 2.4) {
    const decay = runtime.points >= 80 ? 2.2 : runtime.points >= 60 ? 1.1 : 0;
    runtime.points = Math.max(35, runtime.points - decay * dt);
  }

  runtime.totalPoints += runtime.points * dt;
  runtime.sampleTime += dt;
}

export function getHeroStrikeCombatGradeFromPoints(points: number): HeroStrikeCombatGrade {
  if (points >= 82) return "S";
  if (points >= 65) return "A";
  if (points >= 48) return "B";
  if (points >= 28) return "C";
  return "D";
}

export function getHeroStrikeCombatRank(state: HeroStrikeState) {
  const runtime = getRuntime(state);
  return {
    points: runtime.points,
    ratio: runtime.points / 100,
    grade: getHeroStrikeCombatGradeFromPoints(runtime.points),
    peakGrade: getHeroStrikeCombatGradeFromPoints(runtime.peakPoints),
    averagePoints: runtime.sampleTime > 0 ? runtime.totalPoints / runtime.sampleTime : runtime.points,
  };
}

export function getHeroStrikeCombatRankRewardMultiplier(state: HeroStrikeState) {
  const { grade } = getHeroStrikeCombatRank(state);
  if (grade === "S") return 1.3;
  if (grade === "A") return 1.2;
  if (grade === "B") return 1.1;
  if (grade === "C") return 1;
  return 0.9;
}
