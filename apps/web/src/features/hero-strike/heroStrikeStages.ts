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
    enemyWeights: { runner: 0.62, drone: 0.35, tank: 0.03, sniper: 0, weaver: 0, bomber: 0 },
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
    id: "nepal-monastery",
    name: "NEPAL MONASTERY",
    subtitle: "고산 수도원 방어전",
    bossName: "ZENITH ORACLE",
    durationSeconds: 70,
    clearBonus: 7900,
    bossHpBase: 7000,
    bossHpPerLevel: 205,
    bossScore: 13200,
    topColor: "#382452",
    middleColor: "#182347",
    bottomColor: "#070914",
    glowColor: "rgba(180, 120, 255, .2)",
    gridColor: "rgba(201, 156, 255, .08)",
    enemyWeights: { runner: 0.12, drone: 0.18, tank: 0.14, sniper: 0.18, weaver: 0.22, bomber: 0.16 },
    spawnBase: 0.64,
    spawnMin: 0.285,
    spawnDecay: 0.0036,
    enemySpeedMultiplier: 1.18,
    bulletSpeedMultiplier: 1.12,
    bulletPattern: "fan",
    bossPattern: "petals",
  },
  {
    id: "numbani-overrun",
    name: "NUMBANI OVERRUN",
    subtitle: "도심 핵심부 탈환",
    bossName: "ORISA PROTOTYPE",
    durationSeconds: 75,
    clearBonus: 9900,
    bossHpBase: 8600,
    bossHpPerLevel: 235,
    bossScore: 16000,
    topColor: "#224737",
    middleColor: "#133044",
    bottomColor: "#050b13",
    glowColor: "rgba(93, 255, 173, .19)",
    gridColor: "rgba(128, 255, 196, .08)",
    enemyWeights: { runner: 0.1, drone: 0.16, tank: 0.2, sniper: 0.12, weaver: 0.18, bomber: 0.24 },
    spawnBase: 0.59,
    spawnMin: 0.265,
    spawnDecay: 0.0033,
    enemySpeedMultiplier: 1.22,
    bulletSpeedMultiplier: 1.16,
    bulletPattern: "cross",
    bossPattern: "burst",
  },
  {
    id: "rialto-night",
    name: "RIALTO NIGHT",
    subtitle: "야간 수로 봉쇄 작전",
    bossName: "TALON DUCHESS",
    durationSeconds: 80,
    clearBonus: 12300,
    bossHpBase: 10400,
    bossHpPerLevel: 270,
    bossScore: 19500,
    topColor: "#36213d",
    middleColor: "#14233c",
    bottomColor: "#050810",
    glowColor: "rgba(255, 104, 177, .2)",
    gridColor: "rgba(255, 143, 202, .08)",
    enemyWeights: { runner: 0.08, drone: 0.14, tank: 0.18, sniper: 0.18, weaver: 0.2, bomber: 0.22 },
    spawnBase: 0.55,
    spawnMin: 0.245,
    spawnDecay: 0.003,
    enemySpeedMultiplier: 1.26,
    bulletSpeedMultiplier: 1.2,
    bulletPattern: "rain",
    bossPattern: "spiral",
  },
  {
    id: "horizon-lunar",
    name: "HORIZON LUNAR",
    subtitle: "저중력 연구동 침공",
    bossName: "LUNAR BEHEMOTH",
    durationSeconds: 85,
    clearBonus: 15200,
    bossHpBase: 12600,
    bossHpPerLevel: 310,
    bossScore: 23800,
    topColor: "#14274f",
    middleColor: "#191b3b",
    bottomColor: "#03060d",
    glowColor: "rgba(119, 155, 255, .21)",
    gridColor: "rgba(157, 183, 255, .085)",
    enemyWeights: { runner: 0.06, drone: 0.14, tank: 0.22, sniper: 0.18, weaver: 0.18, bomber: 0.22 },
    spawnBase: 0.51,
    spawnMin: 0.225,
    spawnDecay: 0.0028,
    enemySpeedMultiplier: 1.3,
    bulletSpeedMultiplier: 1.24,
    bulletPattern: "assault",
    bossPattern: "lanes",
  },
  {
    id: "gibraltar-orbit",
    name: "GIBRALTAR ORBIT",
    subtitle: "궤도 방어망 최종전",
    bossName: "ORBIT OVERSEER",
    durationSeconds: 90,
    clearBonus: 20000,
    bossHpBase: 15500,
    bossHpPerLevel: 360,
    bossScore: 32000,
    topColor: "#442119",
    middleColor: "#171b35",
    bottomColor: "#050810",
    glowColor: "rgba(255, 105, 94, .22)",
    gridColor: "rgba(255, 148, 112, .09)",
    enemyWeights: { runner: 0.08, drone: 0.14, tank: 0.22, sniper: 0.16, weaver: 0.18, bomber: 0.22 },
    spawnBase: 0.47,
    spawnMin: 0.205,
    spawnDecay: 0.0025,
    enemySpeedMultiplier: 1.34,
    bulletSpeedMultiplier: 1.28,
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