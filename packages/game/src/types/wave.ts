import type { SkillEffectType } from "./skill";

export type WaveEnemyGroup = {
  enemyId: string;
  count: number;
  spawnIntervalMs: number;
};

export type WaveTacticalTheme = "swarm" | "rush" | "armored" | "elite" | "boss" | "mixed";

export type WaveDefinition = {
  id: string;
  waveNumber: number;
  title: string;
  tacticalTheme: WaveTacticalTheme;
  recommendedEffects: SkillEffectType[];
  enemyGroups: WaveEnemyGroup[];
  isBossWave: boolean;
  rewardOnClear: number;
};
