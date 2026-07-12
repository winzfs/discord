import { getHeroStrikeEncounter } from "./heroStrikeEncounters";
import type { EliteTrait, HeroStrikeState } from "./heroStrikeTypes";

const WAVE_THRESHOLDS = [0, 0.28, 0.56, 0.78] as const;
const WAVE_SPAWN_MULTIPLIERS = [1.08, 0.96, 0.84, 0.74] as const;

export function getWaveIndex(stageElapsed: number, durationSeconds: number) {
  const progress = Math.min(1, stageElapsed / Math.max(1, durationSeconds));
  let wave = 1;
  for (let index = 1; index < WAVE_THRESHOLDS.length; index += 1) {
    if (progress >= WAVE_THRESHOLDS[index]) wave = index + 1;
  }
  return wave;
}

export function updateHeroStrikeWave(state: HeroStrikeState, durationSeconds: number) {
  if (state.bossSpawned) return false;
  const nextWave = getWaveIndex(state.stageElapsed, durationSeconds);
  if (nextWave === state.waveIndex) return false;
  state.waveIndex = nextWave;
  state.waveBanner = 1.8;
  state.spawnCooldown = Math.min(state.spawnCooldown, 0.35);
  return true;
}

export function getWaveLabel(waveIndex: number) {
  return getHeroStrikeEncounter(waveIndex).label;
}

export function getWaveSpawnMultiplier(waveIndex: number) {
  return WAVE_SPAWN_MULTIPLIERS[Math.max(0, Math.min(WAVE_SPAWN_MULTIPLIERS.length - 1, waveIndex - 1))];
}

export function getWaveEntryGroupSize(waveIndex: number) {
  if (waveIndex >= 4) return 3;
  if (waveIndex >= 2) return 2;
  return 1;
}

export function shouldSpawnElite(state: HeroStrikeState) {
  return state.waveIndex >= 3 && !state.eliteSpawned && !state.bossSpawned;
}

export function getEliteTraitForStage(stageIndex: number): EliteTrait {
  const traits: readonly EliteTrait[] = ["armored", "rapid", "scatter", "veteran"];
  return traits[Math.max(0, stageIndex) % traits.length];
}

export function getEliteTraitLabel(trait: EliteTrait) {
  if (trait === "armored") return "장갑";
  if (trait === "rapid") return "가속";
  if (trait === "scatter") return "분열";
  return "베테랑";
}
