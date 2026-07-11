import { getDifficultyProfile } from "./heroStrikeLoadout";
import type { HeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function getNextXpRequirement(level: number) {
  const safeLevel = Math.max(1, level);
  return Math.round(24 + safeLevel * 10 + Math.pow(safeLevel, 1.28) * 4.2);
}

export function getNormalEnemyHealthScale(state: HeroStrikeState, stageDuration: number) {
  const stageProgress = Math.min(1, state.stageElapsed / Math.max(1, stageDuration));
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  return (1 + state.stageIndex * 0.15 + stageProgress * 0.3) * difficulty.enemyHealth;
}

export function getBossHealth(state: HeroStrikeState, stage: HeroStrikeStage) {
  const expectedLevel = 4 + state.stageIndex * 2.1;
  const overLevel = Math.max(0, state.player.level - expectedLevel);
  const overLevelScale = 1 + Math.min(0.16, overLevel * 0.02);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  return Math.round(stage.bossHpBase * overLevelScale * difficulty.enemyHealth);
}

export function getEnemyBulletCap(state: HeroStrikeState) {
  const lowHealthRelief = state.player.hp <= 1 ? 14 : state.player.hp <= 2 ? 7 : 0;
  const bossBonus = state.bossSpawned ? 18 : 0;
  const difficultyOffset = state.loadout.difficulty === "legend" ? 8 : state.loadout.difficulty === "recruit" ? -6 : 0;
  return Math.max(48, Math.min(136, 62 + state.stageIndex * 5 + bossBonus + difficultyOffset - lowHealthRelief));
}

export function getSpawnReliefMultiplier(state: HeroStrikeState) {
  if (state.player.hp <= 1) return 1.2;
  if (state.player.hp <= 2) return 1.1;
  return 1;
}

export function getStageObjectiveScore(stageIndex: number) {
  return 1000 + stageIndex * 400;
}

export function getStageObjectiveResearch(stageIndex: number) {
  return 7 + stageIndex * 2;
}

export function getEliteResearchReward(stageIndex: number) {
  return 4 + Math.floor(stageIndex / 2);
}

export function getRunResearchReward(state: HeroStrikeState) {
  const reachedStage = Math.min(10, state.stageIndex + 1);
  const scoreReward = Math.min(36, Math.floor(state.score / 20000));
  const masteryReward = state.objectivesCompleted * 2 + state.perfectStages * 2 + state.evolutions.length * 3;
  const victoryBonus = state.phase === "victory" ? 30 : 0;
  return reachedStage * 3 + scoreReward + masteryReward + victoryBonus;
}

export function getRunGrade(state: HeroStrikeState) {
  if (state.phase === "victory" && state.hitsTaken <= 3 && state.objectivesCompleted >= 8 && state.perfectStages >= 4) return "S";
  if (state.phase === "victory") return "A";
  if (state.stageIndex >= 7 || state.objectivesCompleted >= 6) return "B";
  if (state.stageIndex >= 4) return "C";
  return "D";
}
