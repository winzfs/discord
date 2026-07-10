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
  {
    id: "kings-row",
    name: "KING'S ROW",
    subtitle: "도시 상공 방어선",
    bossName: "SENTRY PRIME",
    durationSeconds: 45,
    clearBonus: 1800,
    bossHpBase: 1800,
    bossHpPerLevel: 90,
    bossScore: 3800,
    topColor: "#0b3155",
    middleColor: "#071c35",
    bottomColor: "#040912",
    glowColor: "rgba(63, 190, 255, .16)",
    gridColor: "rgba(105, 231, 255, .07)",
    enemyWeights: { runner: 0.55, drone: 0.35, tank: 0.03, sniper: 0.05, weaver: 0.02, bomber: 0 },
    spawnBase: 0.98,
    spawnMin: 0.48,
    spawnDecay: 0.006,
    enemySpeedMultiplier: 1,
    bulletSpeedMultiplier: 0.9,
    bulletPattern: "aimed",
    bossPattern: "fan",
  },
  {
    id: "hanamura-ruins",
    name: "HANAMURA RUINS",
    subtitle: "벚꽃 폐허 침투",
    bossName: "KITSUNE WATCHER",
    durationSeconds: 50,
    clearBonus: 2600,
    bossHpBase: 2500,
    bossHpPerLevel: 110,
    bossScore: 5000,
    topColor: "#44233f",
    middleColor: "#191a38",
    bottomColor: "#050913",
    glowColor: "rgba(255, 129, 196, .16)",
    gridColor: "rgba(255, 170, 220, .065)",
    enemyWeights: { runner: 0.35, drone: 0.25, tank: 0.05, sniper: 0.12, weaver: 0.2, bomber: 0.03 },
    spawnBase: 0.9,
    spawnMin: 0.43,
    spawnDecay: 0.0055,
    enemySpeedMultiplier: 1.04,
    bulletSpeedMultiplier: 0.96,
    bulletPattern: "split",
    bossPattern: "petals",
  },
  {
    id: "null-sector-factory",
    name: "NULL SECTOR FACTORY",
    subtitle: "생산 구역 돌파",
    bossName: "FACTORY WARDEN",
    durationSeconds: 55,
    clearBonus: 3500,
    bossHpBase: 3300,
    bossHpPerLevel: 130,
    bossScore: 6500,
    topColor: "#291742",
    middleColor: "#121b38",
    bottomColor: "#050812",
    glowColor: "rgba(187, 134, 252, .17)",
    gridColor: "rgba(196, 145, 255, .07)",
    enemyWeights: { runner: 0.22, drone: 0.35, tank: 0.12, sniper: 0.08, weaver: 0.13, bomber: 0.1 },
    spawnBase: 0.82,
    spawnMin: 0.38,
    spawnDecay: 0.005,
    enemySpeedMultiplier: 1.08,
    bulletSpeedMultiplier: 1,
    bulletPattern: "cross",
    bossPattern: "spiral",
  },
  {
    id: "antarctic-base",
    name: "ANTARCTIC BASE",
    subtitle: "빙하 연구 기지 탈출",
    bossName: "CRYO COMMANDER",
    durationSeconds: 60,
    clearBonus: 4700,
    bossHpBase: 4300,
    bossHpPerLevel: 150,
    bossScore: 8200,
    topColor: "#12344c",
    middleColor: "#10243a",
    bottomColor: "#040b13",
    glowColor: "rgba(121, 231, 255, .18)",
    gridColor: "rgba(158, 238, 255, .075)",
    enemyWeights: { runner: 0.18, drone: 0.22, tank: 0.16, sniper: 0.22, weaver: 0.12, bomber: 0.1 },
    spawnBase: 0.76,
    spawnMin: 0.35,
    spawnDecay: 0.0045,
    enemySpeedMultiplier: 1.1,
    bulletSpeedMultiplier: 1.04,
    bulletPattern: "rain",
    bossPattern: "lanes",
  },
  {
    id: "junkertown-skyway",
    name: "JUNKERTOWN SKYWAY",
    subtitle: "황무지 수송로 강습",
    bossName: "SCRAP COLOSSUS",
    durationSeconds: 65,
    clearBonus: 6200,
    bossHpBase: 5600,
    bossHpPerLevel: 175,
    bossScore: 10500,
    topColor: "#543018",
    middleColor: "#272037",
    bottomColor: "#080810",
    glowColor: "rgba(255, 170, 67, .19)",
    gridColor: "rgba(255, 192, 95, .075)",
    enemyWeights: { runner: 0.2, drone: 0.16, tank: 0.16, sniper: 0.08, weaver: 0.18, bomber: 0.22 },
    spawnBase: 0.69,
    spawnMin: 0.32,
    spawnDecay: 0.004,
    enemySpeedMultiplier: 1.14,
    bulletSpeedMultiplier: 1.08,
    bulletPattern: "fan",
    bossPattern: "burst",
  },
  {
    id: "gibraltar-orbit",
    name: "GIBRALTAR ORBIT",
    subtitle: "궤도 방어망 최종전",
    bossName: "ORBIT OVERSEER",
    durationSeconds: 70,
    clearBonus: 9000,
    bossHpBase: 7200,
    bossHpPerLevel: 210,
    bossScore: 15000,
    topColor: "#442119",
    middleColor: "#171b35",
    bottomColor: "#050810",
    glowColor: "rgba(255, 105, 94, .19)",
    gridColor: "rgba(255, 148, 112, .08)",
    enemyWeights: { runner: 0.12, drone: 0.16, tank: 0.2, sniper: 0.14, weaver: 0.18, bomber: 0.2 },
    spawnBase: 0.62,
    spawnMin: 0.29,
    spawnDecay: 0.0035,
    enemySpeedMultiplier: 1.18,
    bulletSpeedMultiplier: 1.13,
    bulletPattern: "assault",
    bossPattern: "hybrid",
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
  let cumulative = 0;
  for (const kind of ["runner", "drone", "tank", "sniper", "weaver", "bomber"] as const) {
    cumulative += stage.enemyWeights[kind];
    if (roll < cumulative) return kind;
  }
  return "bomber";
}