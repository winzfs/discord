import { HERO_STRIKE_EARLY_STAGES } from "./heroStrikeStageCatalogEarly";
import { HERO_STRIKE_LATE_STAGES } from "./heroStrikeStageCatalogLate";
import type { EnemyKind, HeroStrikeState, StageId } from "./heroStrikeTypes";

export type NormalEnemyKind = Exclude<EnemyKind, "boss">;
export type StageBulletPattern = "aimed" | "split" | "cross" | "rain" | "fan" | "assault";
export type BossBulletPattern = "fan" | "petals" | "spiral" | "lanes" | "burst" | "hybrid";

export type HeroStrikeStage = {
  id: StageId;
  name: string;
  subtitle: string;
  bossName: string;
  durationSeconds: number;
  clearBonus: number;
  bossHpBase: number;
  bossHpPerLevel: number;
  bossScore: number;
  topColor: string;
  middleColor: string;
  bottomColor: string;
  glowColor: string;
  gridColor: string;
  enemyWeights: Record<NormalEnemyKind, number>;
  spawnBase: number;
  spawnMin: number;
  spawnDecay: number;
  enemySpeedMultiplier: number;
  bulletSpeedMultiplier: number;
  bulletPattern: StageBulletPattern;
  bossPattern: BossBulletPattern;
};

export const HERO_STRIKE_STAGES: readonly HeroStrikeStage[] = [
  HERO_STRIKE_EARLY_STAGES[0],
  HERO_STRIKE_EARLY_STAGES[2],
  HERO_STRIKE_EARLY_STAGES[4],
  HERO_STRIKE_LATE_STAGES[2],
  HERO_STRIKE_LATE_STAGES[4],
];

export function getHeroStrikeStage(index: number) {
  return HERO_STRIKE_STAGES[Math.max(0, Math.min(HERO_STRIKE_STAGES.length - 1, index))];
}

export function getCurrentHeroStrikeStage(state: Pick<HeroStrikeState, "stageIndex">) {
  return getHeroStrikeStage(state.stageIndex);
}

export function isFinalHeroStrikeStage(index: number) {
  return index >= HERO_STRIKE_STAGES.length - 1;
}

export function getHeroStrikeOperationEstimatedMinutes() {
  const combatSeconds = HERO_STRIKE_STAGES.reduce(
    (total, stage) => total + stage.durationSeconds + 42,
    0,
  );
  const armorySeconds = Math.max(0, HERO_STRIKE_STAGES.length - 1) * 16;
  return Math.max(1, Math.ceil((combatSeconds + armorySeconds) / 60));
}

export function chooseEnemyKindForStage(stage: HeroStrikeStage, roll = Math.random()): NormalEnemyKind {
  let cumulative = 0;
  for (const kind of ["runner", "drone", "tank", "sniper", "weaver", "bomber"] as const) {
    cumulative += stage.enemyWeights[kind];
    if (roll < cumulative) return kind;
  }
  return "bomber";
}
