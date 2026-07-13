import { getDifficultyProfile } from "./heroStrikeLoadout";
import type { HeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export const HERO_STRIKE_LEVEL_CAP = 18;

export function getNextXpRequirement(level: number) {
  const safeLevel = Math.max(1, level);
  return Math.round(72 + safeLevel * 18 + Math.pow(safeLevel, 1.35) * 8);
}

export function getNormalEnemyHealthScale(state: HeroStrikeState, stageDuration: number) {
  const stageProgress = Math.min(1, state.stageElapsed / Math.max(1, stageDuration));
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  return (1.12 + state.stageIndex * 0.22 + stageProgress * 0.45) * difficulty.enemyHealth;
}

export function getBossHealth(state: HeroStrikeState, stage: HeroStrikeStage) {
  const expectedLevel = 3 + state.stageIndex * 2.4;
  const overLevel = Math.max(0, state.player.level - expectedLevel);
  const overLevelScale = 1 + Math.min(0.22, overLevel * 0.03);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  return Math.round(stage.bossHpBase * 1.08 * overLevelScale * difficulty.enemyHealth);
}

export function getEnemyBulletCap(state: HeroStrikeState) {
  const lowHealthRelief = state.player.hp <= 1 ? 14 : state.player.hp <= 2 ? 7 : 0;
  const bossBonus = state.bossSpawned ? 14 : 0;
  const difficultyOffset = state.loadout.difficulty === "legend" ? 7 : state.loadout.difficulty === "recruit" ? -6 : 0;
  return Math.max(44, Math.min(112, 54 + state.stageIndex * 7 + bossBonus + difficultyOffset - lowHealthRelief));
}

export function getSpawnReliefMultiplier(state: HeroStrikeState) {
  if (state.player.hp <= 1) return 1.18;
  if (state.player.hp <= 2) return 1.09;
  return 1;
}

export function getStageObjectiveScore(stageIndex: number) {
  return 1000 + stageIndex * 650;
}

export function getStageObjectiveResearch(stageIndex: number) {
  return 7 + stageIndex * 3;
}

export function getEliteResearchReward(stageIndex: number) {
  return 4 + Math.floor(stageIndex / 2);
}

export function getRunResearchReward(state: HeroStrikeState) {
  const reachedStage = Math.min(5, state.stageIndex + 1);
  const scoreReward = Math.min(36, Math.floor(state.score / 20000));
  const masteryReward = state.objectivesCompleted * 3 + state.perfectStages * 3 + state.evolutions.length * 4;
  const victoryBonus = state.phase === "victory" ? 30 : 0;
  return reachedStage * 5 + scoreReward + masteryReward + victoryBonus;
}

export function getRunGrade(state: HeroStrikeState) {
  if (state.phase === "victory" && state.hitsTaken <= 3 && state.objectivesCompleted >= 4 && state.perfectStages >= 2) return "S";
  if (state.phase === "victory") return "A";
  if (state.stageIndex >= 3 || state.objectivesCompleted >= 3) return "B";
  if (state.stageIndex >= 1 || state.objectivesCompleted >= 1) return "C";
  return "D";
}
