export type WaveEnemyGroup = {
  enemyId: string;
  count: number;
  spawnIntervalMs: number;
};

export type WaveDefinition = {
  id: string;
  waveNumber: number;
  enemyGroups: WaveEnemyGroup[];
  isBossWave: boolean;
  rewardOnClear: number;
};
