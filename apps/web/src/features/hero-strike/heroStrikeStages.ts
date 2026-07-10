import type { EnemyKind, HeroStrikeState, StageId } from "./heroStrikeTypes";

type NormalEnemyKind = Exclude<EnemyKind, "boss">;

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
  bulletPattern: "aimed" | "split" | "assault";
};

export const HERO_STRIKE_STAGES: readonly HeroStrikeStage[] = [
  {
    id: "kings-row",
    name: "KING'S ROW",
    subtitle: "도시 상공 방어선",
    bossName: "SENTRY PRIME",
    durationSeconds: 24,
    clearBonus: 1500,
    bossHpBase: 1500,
    bossHpPerLevel: 90,
    bossScore: 3500,
    topColor: "#0b3155",
    middleColor: "#071c35",
    bottomColor: "#040912",
    glowColor: "rgba(63, 190, 255, .16)",
    gridColor: "rgba(105, 231, 255, .07)",
    enemyWeights: { runner: 0.66, drone: 0.31, tank: 0.03 },
    spawnBase: 0.98,
    spawnMin: 0.48,
    spawnDecay: 0.008,
    enemySpeedMultiplier: 1,
    bulletSpeedMultiplier: 0.92,
    bulletPattern: "aimed",
  },
  {
    id: "null-sector-factory",
    name: "NULL SECTOR FACTORY",
    subtitle: "생산 구역 돌파",
    bossName: "FACTORY WARDEN",
    durationSeconds: 27,
    clearBonus: 2500,
    bossHpBase: 2400,
    bossHpPerLevel: 120,
    bossScore: 5200,
    topColor: "#291742",
    middleColor: "#121b38",
    bottomColor: "#050812",
    glowColor: "rgba(187, 134, 252, .17)",
    gridColor: "rgba(196, 145, 255, .07)",
    enemyWeights: { runner: 0.34, drone: 0.5, tank: 0.16 },
    spawnBase: 0.84,
    spawnMin: 0.4,
    spawnDecay: 0.006,
    enemySpeedMultiplier: 1.07,
    bulletSpeedMultiplier: 1,
    bulletPattern: "split",
  },
  {
    id: "gibraltar-orbit",
    name: "GIBRALTAR ORBIT",
    subtitle: "궤도 방어망 최종전",
    bossName: "ORBIT OVERSEER",
    durationSeconds: 30,
    clearBonus: 5000,
    bossHpBase: 3600,
    bossHpPerLevel: 160,
    bossScore: 8000,
    topColor: "#442119",
    middleColor: "#171b35",
    bottomColor: "#050810",
    glowColor: "rgba(255, 155, 61, .17)",
    gridColor: "rgba(255, 183, 94, .075)",
    enemyWeights: { runner: 0.28, drone: 0.36, tank: 0.36 },
    spawnBase: 0.72,
    spawnMin: 0.34,
    spawnDecay: 0.004,
    enemySpeedMultiplier: 1.14,
    bulletSpeedMultiplier: 1.1,
    bulletPattern: "assault",
  },
] as const;

export function getHeroStrikeStage(index: number) {
  return HERO_STRIKE_STAGES[Math.max(0, Math.min(HERO_STRIKE_STAGES.length - 1, index))];
}

export function getCurrentHeroStrikeStage(state: Pick<HeroStrikeState, "stageIndex">) {
  return getHeroStrikeStage(state.stageIndex);
}

export function isFinalHeroStrikeStage(index: number) {
  return index >= HERO_STRIKE_STAGES.length - 1;
}

export function chooseEnemyKindForStage(stage: HeroStrikeStage, roll = Math.random()): NormalEnemyKind {
  if (roll < stage.enemyWeights.runner) return "runner";
  if (roll < stage.enemyWeights.runner + stage.enemyWeights.drone) return "drone";
  return "tank";
}