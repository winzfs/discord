import type { HeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function getNextXpRequirement(level: number) {
  const safeLevel = Math.max(1, level);
  return Math.round(24 + safeLevel * 10 + Math.pow(safeLevel, 1.28) * 4.2);
}

export function getNormalEnemyHealthScale(state: HeroStrikeState, stageDuration: number) {
  const stageProgress = Math.min(1, state.stageElapsed / Math.max(1, stageDuration));
  return 1 + state.stageIndex * 0.16 + stageProgress * 0.34;
}

export function getBossHealth(state: HeroStrikeState, stage: HeroStrikeStage) {
  const expectedLevel = 4 + state.stageIndex * 2.1;
  const overLevel = Math.max(0, state.player.level - expectedLevel);
  const overLevelScale = 1 + Math.min(0.2, overLevel * 0.025);
  return Math.round(stage.bossHpBase * overLevelScale);
}

export function getEnemyBulletCap(state: HeroStrikeState) {
  const lowHealthRelief = state.player.hp <= 1 ? 12 : state.player.hp <= 2 ? 6 : 0;
  const bossBonus = state.bossSpawned ? 18 : 0;
  return Math.max(54, Math.min(132, 64 + state.stageIndex * 5 + bossBonus - lowHealthRelief));
}

export function getSpawnReliefMultiplier(state: HeroStrikeState) {
  if (state.player.hp <= 1) return 1.18;
  if (state.player.hp <= 2) return 1.08;
  return 1;
}

export function getStageObjectiveScore(stageIndex: number) {
  return 900 + stageIndex * 350;
}

export function getStageObjectiveResearch(stageIndex: number) {
  return 8 + stageIndex * 2;
}

export function getEliteResearchReward(stageIndex: number) {
  return 4 + Math.floor(stageIndex / 2);
}

export function getRunResearchReward(state: HeroStrikeState) {
  const reachedStage = Math.min(10, state.stageIndex + (state.phase === "victory" ? 1 : 0));
  const scoreReward = Math.min(40, Math.floor(state.score / 18000));
  const victoryBonus = state.phase === "victory" ? 35 : 0;
  return reachedStage * 3 + scoreReward + victoryBonus;
}

export function getRunGrade(state: HeroStrikeState) {
  if (state.phase === "victory" && state.hitsTaken <= 4 && state.maxCombo >= 80) return "S";
  if (state.phase === "victory") return "A";
  if (state.stageIndex >= 7) return "B";
  if (state.stageIndex >= 4) return "C";
  return "D";
}
