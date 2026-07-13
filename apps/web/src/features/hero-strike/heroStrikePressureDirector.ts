import { getCurrentHeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikePressureTier = 0 | 1 | 2 | 3 | 4;

export type HeroStrikePressureSnapshot = {
  value: number;
  ratio: number;
  tier: HeroStrikePressureTier;
  label: string;
  accent: string;
  eventLabel: string | null;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function pressureValue(state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const stageProgress = clamp01(state.stageElapsed / Math.max(1, stage.durationSeconds));
  const activeEnemies = state.enemies.filter((enemy) => !enemy.dead).length;
  const enemyBullets = state.bullets.reduce((count, bullet) => count + (bullet.enemy ? 1 : 0), 0);
  const enemyLoad = clamp01(activeEnemies / 11);
  const bulletLoad = clamp01(enemyBullets / 82);
  const momentum = clamp01(state.player.combo / 42);
  const bossPhase = state.enemies.find((enemy) => enemy.boss)?.bossPhase ?? 0;
  const lowHealthRelief = state.player.hp <= 1 ? 0.14 : state.player.hp <= 2 ? 0.07 : 0;

  const operationPressure = 0.12
    + state.stageIndex * 0.075
    + stageProgress * 0.38
    + enemyLoad * 0.2
    + bulletLoad * 0.14
    + momentum * 0.08
    - lowHealthRelief;
  const bossPressure = state.bossSpawned ? 0.72 + bossPhase * 0.075 : 0;
  return clamp01(Math.max(operationPressure, bossPressure));
}

function pressureTier(value: number): HeroStrikePressureTier {
  if (value >= 0.84) return 4;
  if (value >= 0.66) return 3;
  if (value >= 0.46) return 2;
  if (value >= 0.25) return 1;
  return 0;
}

function tierPresentation(tier: HeroStrikePressureTier) {
  if (tier === 4) return { label: "OMEGA", accent: "#ff5f6d" };
  if (tier === 3) return { label: "REDLINE", accent: "#ff9b3d" };
  if (tier === 2) return { label: "ASSAULT", accent: "#ffd166" };
  if (tier === 1) return { label: "CONTACT", accent: "#69e7ff" };
  return { label: "CONTROL", accent: "#79f29d" };
}

function pressureEventLabel(state: HeroStrikeState, tier: HeroStrikePressureTier) {
  if (state.bossWarning > 0) return "BOSS SIGNAL DETECTED";
  if (state.waveBanner > 0) {
    if (state.waveIndex >= 4) return "ELITE COMMANDER INBOUND";
    if (tier >= 3) return "HOSTILE DENSITY SURGING";
    return `ENCOUNTER ${state.waveIndex} ENGAGED`;
  }
  if (state.flowBanner > 0) return "PULSE RUSH ONLINE";
  if (state.bossBreakBanner > 0) return "BOSS CORE EXPOSED";
  return null;
}

export function getHeroStrikePressureSnapshot(state: HeroStrikeState): HeroStrikePressureSnapshot {
  const value = pressureValue(state);
  const tier = pressureTier(value);
  const presentation = tierPresentation(tier);
  return {
    value,
    ratio: value,
    tier,
    ...presentation,
    eventLabel: pressureEventLabel(state, tier),
  };
}

export function getHeroStrikePressureSpawnIntervalMultiplier(state: HeroStrikeState) {
  const pressure = pressureValue(state);
  return Math.max(0.86, 1 - pressure * 0.14);
}

export function getHeroStrikePressureEnemyCapBonus(state: HeroStrikeState) {
  return Math.floor(pressureValue(state) * 2.5);
}

export function getHeroStrikePressureBulletSpeedMultiplier(state: HeroStrikeState) {
  return 0.98 + pressureValue(state) * 0.1;
}
