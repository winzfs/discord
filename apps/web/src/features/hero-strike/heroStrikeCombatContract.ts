import type { EliteTrait, HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeContractId = "overrun" | "crossfire" | "execution" | "flawless";

type HeroStrikeContractDefinition = {
  id: HeroStrikeContractId;
  label: string;
  title: string;
  brief: string;
  accent: string;
  rewardMultiplier: number;
  spawnIntervalMultiplier: number;
  enemyCapBonus: number;
  bulletSpeedMultiplier: number;
  eliteHealthMultiplier: number;
  eliteTrait?: EliteTrait;
  flawless?: boolean;
};

type HeroStrikeContractRuntime = {
  stageIndex: number;
  waveIndex: number;
  startHits: number;
};

const CONTRACTS: readonly HeroStrikeContractDefinition[] = [
  {
    id: "overrun",
    label: "OVERRUN",
    title: "과부하 공세",
    brief: "적 편성이 더 빠르고 두꺼워집니다",
    accent: "#ff9b3d",
    rewardMultiplier: 1.18,
    spawnIntervalMultiplier: 0.84,
    enemyCapBonus: 2,
    bulletSpeedMultiplier: 1,
    eliteHealthMultiplier: 1,
    eliteTrait: "rapid",
  },
  {
    id: "crossfire",
    label: "CROSSFIRE",
    title: "교차 탄막",
    brief: "적탄 속도가 증가하고 산개 탄막이 강화됩니다",
    accent: "#ff5f6d",
    rewardMultiplier: 1.2,
    spawnIntervalMultiplier: 0.96,
    enemyCapBonus: 0,
    bulletSpeedMultiplier: 1.13,
    eliteHealthMultiplier: 1,
    eliteTrait: "scatter",
  },
  {
    id: "execution",
    label: "EXECUTION",
    title: "지휘 개체 처형",
    brief: "정예 개체가 강화되지만 보상이 크게 증가합니다",
    accent: "#bb86fc",
    rewardMultiplier: 1.24,
    spawnIntervalMultiplier: 1,
    enemyCapBonus: 0,
    bulletSpeedMultiplier: 1.04,
    eliteHealthMultiplier: 1.28,
    eliteTrait: "veteran",
  },
  {
    id: "flawless",
    label: "NO HIT",
    title: "무결점 계약",
    brief: "현재 조우에서 피격되지 않으면 보너스 획득",
    accent: "#79f29d",
    rewardMultiplier: 1.32,
    spawnIntervalMultiplier: 0.94,
    enemyCapBonus: 1,
    bulletSpeedMultiplier: 1.05,
    eliteHealthMultiplier: 1,
    eliteTrait: "armored",
    flawless: true,
  },
];

const runtimeByState = new WeakMap<HeroStrikeState, HeroStrikeContractRuntime>();

function contractIndex(state: HeroStrikeState) {
  if (state.waveIndex >= 4) return 2;
  return Math.abs(state.stageIndex * 3 + Math.max(0, state.waveIndex - 1)) % CONTRACTS.length;
}

function contractDefinition(state: HeroStrikeState) {
  return CONTRACTS[contractIndex(state)];
}

function ensureRuntime(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime || runtime.stageIndex !== state.stageIndex || runtime.waveIndex !== state.waveIndex) {
    runtime = {
      stageIndex: state.stageIndex,
      waveIndex: state.waveIndex,
      startHits: state.stageHits,
    };
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function getHeroStrikeCombatContract(state: HeroStrikeState) {
  const definition = contractDefinition(state);
  const runtime = ensureRuntime(state);
  const eligible = !definition.flawless || state.stageHits === runtime.startHits;
  return {
    ...definition,
    eligible,
    rewardMultiplier: eligible ? definition.rewardMultiplier : 1,
    statusLabel: definition.flawless
      ? eligible ? "BONUS ARMED" : "BONUS LOST"
      : `REWARD +${Math.round((definition.rewardMultiplier - 1) * 100)}%`,
  };
}

export function getHeroStrikeContractSpawnIntervalMultiplier(state: HeroStrikeState) {
  return contractDefinition(state).spawnIntervalMultiplier;
}

export function getHeroStrikeContractEnemyCapBonus(state: HeroStrikeState) {
  return contractDefinition(state).enemyCapBonus;
}

export function getHeroStrikeContractBulletSpeedMultiplier(state: HeroStrikeState) {
  return contractDefinition(state).bulletSpeedMultiplier;
}

export function getHeroStrikeContractEliteHealthMultiplier(state: HeroStrikeState) {
  return contractDefinition(state).eliteHealthMultiplier;
}

export function getHeroStrikeContractEliteTrait(state: HeroStrikeState, fallback: EliteTrait) {
  return contractDefinition(state).eliteTrait ?? fallback;
}
