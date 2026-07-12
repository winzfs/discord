import { recordHeroStrikeCombatRankMission } from "./heroStrikeCombatRank";
import { HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeMissionDefinition } from "./heroStrikeEncounterCatalog";
import {
  calculateHeroStrikeMissionReward,
  presentHeroStrikeMissionFailure,
  presentHeroStrikeMissionSuccess,
} from "./heroStrikeEncounterRewards";
import type {
  HeroStrikeMissionRuntime,
  HeroStrikeMissionSnapshot,
  HeroStrikeOperationRuntime,
} from "./heroStrikeEncounterTypes";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

const runtimeByState = new WeakMap<HeroStrikeState, HeroStrikeOperationRuntime>();

function createMission(
  state: HeroStrikeState,
  stageIndex = state.stageIndex,
  waveIndex = state.waveIndex,
): HeroStrikeMissionRuntime {
  const definition = getHeroStrikeMissionDefinition(stageIndex, waveIndex);
  const zoneOnRight = (stageIndex + waveIndex) % 2 === 0;
  return {
    stageIndex,
    waveIndex,
    definition,
    status: "active",
    progress: 0,
    startKills: state.stageKills,
    startHits: state.stageHits,
    targetEnemyId: null,
    lastTargetY: 0,
    targetEnhanced: false,
    zoneX: zoneOnRight ? HERO_STRIKE_WIDTH - 112 : 112,
    zoneY: 558,
    zoneRadius: 72,
  };
}

function createOperation(state: HeroStrikeState): HeroStrikeOperationRuntime {
  return {
    current: createMission(state),
    salvage: 0,
    missionsSucceeded: 0,
    missionsFailed: 0,
    perfectMissions: 0,
  };
}

export function resetHeroStrikeOperation(state: HeroStrikeState) {
  runtimeByState.set(state, createOperation(state));
}

function succeedMission(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  if (mission.status !== "active") return false;
  mission.status = "succeeded";
  mission.progress = Math.max(mission.progress, mission.definition.target);
  const reward = calculateHeroStrikeMissionReward(state, mission.definition);
  operation.salvage += reward.salvage;
  operation.missionsSucceeded += 1;
  if (state.stageHits === mission.startHits) operation.perfectMissions += 1;
  recordHeroStrikeCombatRankMission(state, true);
  presentHeroStrikeMissionSuccess(state, mission.definition, reward);
  return true;
}

function failMission(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  if (mission.status !== "active") return false;
  mission.status = "failed";
  operation.missionsFailed += 1;
  recordHeroStrikeCombatRankMission(state, false);
  presentHeroStrikeMissionFailure(state, mission.definition);
  return true;
}

function resolveActiveMission(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  if (mission.status !== "active") return;
  if (mission.progress >= mission.definition.target) succeedMission(state, operation);
  else failMission(state, operation);
}

function ensureOperation(state: HeroStrikeState) {
  let operation = runtimeByState.get(state);
  if (!operation) {
    operation = createOperation(state);
    runtimeByState.set(state, operation);
    return operation;
  }

  const mission = operation.current;
  if (mission.stageIndex !== state.stageIndex || mission.waveIndex !== state.waveIndex) {
    resolveActiveMission(state, operation);
    operation.current = createMission(state);
  }
  return operation;
}

function distanceSquared(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function chooseInterceptTarget(state: HeroStrikeState, mission: HeroStrikeMissionRuntime) {
  const candidate = state.enemies
    .filter((enemy) => !enemy.dead && !enemy.boss && !enemy.elite)
    .filter((enemy) => enemy.y > 22 && enemy.y < 260)
    .sort((left, right) => {
      const leftPriority = left.kind === "drone" || left.kind === "sniper" ? 0 : 1;
      const rightPriority = right.kind === "drone" || right.kind === "sniper" ? 0 : 1;
      return leftPriority - rightPriority || left.y - right.y;
    })[0];
  if (!candidate) return null;

  mission.targetEnemyId = candidate.id;
  mission.lastTargetY = candidate.y;
  if (!mission.targetEnhanced) {
    candidate.maxHp *= 1.45;
    candidate.hp *= 1.45;
    candidate.vy = Math.max(candidate.vy, 118 + state.stageIndex * 4);
    candidate.reward = Math.round(candidate.reward * 1.8);
    candidate.score = Math.round(candidate.score * 2.2);
    mission.targetEnhanced = true;
  }
  return candidate;
}

function updateSweep(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  mission.progress = Math.max(0, state.stageKills - mission.startKills);
  if (mission.progress >= mission.definition.target) succeedMission(state, operation);
}

function updateIntercept(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  let target: HeroStrikeEnemy | undefined;
  if (mission.targetEnemyId === null) {
    target = chooseInterceptTarget(state, mission) ?? undefined;
    return;
  }

  target = state.enemies.find((enemy) => enemy.id === mission.targetEnemyId && !enemy.dead);
  if (target) {
    mission.lastTargetY = target.y;
    return;
  }

  if (mission.lastTargetY >= HERO_STRIKE_HEIGHT - 100) failMission(state, operation);
  else {
    mission.progress = 1;
    succeedMission(state, operation);
  }
}

function updateHold(state: HeroStrikeState, operation: HeroStrikeOperationRuntime, dt: number) {
  const mission = operation.current;
  const inside = distanceSquared(
    state.player.x,
    state.player.y,
    mission.zoneX,
    mission.zoneY,
  ) <= mission.zoneRadius * mission.zoneRadius;
  if (inside) mission.progress = Math.min(mission.definition.target, mission.progress + dt);
  if (mission.progress >= mission.definition.target) succeedMission(state, operation);
}

function updateEliteDuel(state: HeroStrikeState, operation: HeroStrikeOperationRuntime) {
  const mission = operation.current;
  const elite = state.enemies.find((enemy) => enemy.elite && !enemy.dead);
  if (elite) {
    mission.targetEnemyId = elite.id;
    mission.lastTargetY = elite.y;
  }
  if (state.eliteDefeated) {
    mission.progress = 1;
    succeedMission(state, operation);
  }
}

export function updateHeroStrikeEncounter(state: HeroStrikeState, dt: number) {
  if (state.phase !== "playing" || state.bossSpawned) return;
  const operation = ensureOperation(state);
  const mission = operation.current;
  if (mission.status !== "active") return;

  if (mission.definition.kind === "sweep") updateSweep(state, operation);
  else if (mission.definition.kind === "intercept") updateIntercept(state, operation);
  else if (mission.definition.kind === "hold") updateHold(state, operation, dt);
  else updateEliteDuel(state, operation);
}

export function resolveHeroStrikeEncounterBoundary(state: HeroStrikeState) {
  const operation = ensureOperation(state);
  resolveActiveMission(state, operation);
}

export function getHeroStrikeMissionSnapshot(state: HeroStrikeState): HeroStrikeMissionSnapshot {
  const operation = ensureOperation(state);
  const mission = operation.current;
  const insideZone = mission.definition.kind === "hold"
    && distanceSquared(state.player.x, state.player.y, mission.zoneX, mission.zoneY)
      <= mission.zoneRadius * mission.zoneRadius;
  return {
    definition: mission.definition,
    status: mission.status,
    progress: mission.progress,
    ratio: Math.max(0, Math.min(1, mission.progress / Math.max(0.001, mission.definition.target))),
    targetEnemyId: mission.targetEnemyId,
    zoneX: mission.zoneX,
    zoneY: mission.zoneY,
    zoneRadius: mission.zoneRadius,
    insideZone,
    salvage: operation.salvage,
    missionsSucceeded: operation.missionsSucceeded,
    missionsFailed: operation.missionsFailed,
  };
}

export function getHeroStrikeOperationSummary(state: HeroStrikeState) {
  const operation = ensureOperation(state);
  return {
    salvage: operation.salvage,
    missionsSucceeded: operation.missionsSucceeded,
    missionsFailed: operation.missionsFailed,
    perfectMissions: operation.perfectMissions,
  };
}
