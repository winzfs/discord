import type { EnemyKind, HeroStrikeState, StageId } from "./heroStrikeTypes";

type NormalEnemyKind = Exclude<EnemyKind, "boss">;

export type HeroStrikeStage = {
  id: StageId;
  name: string;
  subtitle: string;
  startsAt: number;
  endsAt: number;
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
    startsAt: 0,
    endsAt: 20,
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
    startsAt: 20,
    endsAt: 40,
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
    startsAt: 40,
    endsAt: 60,
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

export function getHeroStrikeStageIndex(elapsed: number) {
  const index = HERO_STRIKE_STAGES.findIndex((stage) => elapsed >= stage.startsAt && elapsed < stage.endsAt);
  return index >= 0 ? index : HERO_STRIKE_STAGES.length - 1;
}

export function getHeroStrikeStage(index: number) {
  return HERO_STRIKE_STAGES[Math.max(0, Math.min(HERO_STRIKE_STAGES.length - 1, index))];
}

export function getCurrentHeroStrikeStage(state: Pick<HeroStrikeState, "stageIndex">) {
  return getHeroStrikeStage(state.stageIndex);
}

export function chooseEnemyKindForStage(stage: HeroStrikeStage, roll = Math.random()): NormalEnemyKind {
  if (roll < stage.enemyWeights.runner) return "runner";
  if (roll < stage.enemyWeights.runner + stage.enemyWeights.drone) return "drone";
  return "tank";
}
