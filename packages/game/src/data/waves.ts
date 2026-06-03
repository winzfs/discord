import { initialBalance } from "./balance";
import type { WaveDefinition, WaveEnemyGroup } from "../types/wave";

function createNormalWave(waveNumber: number): WaveDefinition {
  const enemyGroups: WaveEnemyGroup[] = [
    {
      enemyId: waveNumber >= 8 && waveNumber % 3 === 0 ? "ping-runner" : "bug-grunt",
      count: 10 + waveNumber * 2,
      spawnIntervalMs: Math.max(300, 900 - waveNumber * 15),
    },
  ];

  if (waveNumber >= 10 && waveNumber % 4 === 0) {
    enemyGroups.push({
      enemyId: "lag-chunk",
      count: Math.ceil(waveNumber / 4),
      spawnIntervalMs: 1_100,
    });
  }

  return {
    id: `wave-${String(waveNumber).padStart(3, "0")}`,
    waveNumber,
    enemyGroups,
    isBossWave: false,
    rewardOnClear: 10 + waveNumber * 2,
  };
}

function createBossWave(waveNumber: number): WaveDefinition {
  return {
    id: `wave-${String(waveNumber).padStart(3, "0")}`,
    waveNumber,
    enemyGroups: [
      {
        enemyId: "server-crasher",
        count: 1,
        spawnIntervalMs: 1_000,
      },
      {
        enemyId: waveNumber >= 15 ? "ping-runner" : "bug-grunt",
        count: Math.floor(waveNumber / 2),
        spawnIntervalMs: 700,
      },
    ],
    isBossWave: true,
    rewardOnClear: 50 + waveNumber * 5,
  };
}

export const waves: WaveDefinition[] = Array.from({ length: initialBalance.maxWave }, (_, index) => {
  const waveNumber = index + 1;
  return waveNumber % initialBalance.bossWaveInterval === 0 ? createBossWave(waveNumber) : createNormalWave(waveNumber);
});

export function getWaveByNumber(waveNumber: number): WaveDefinition | null {
  return waves.find((wave) => wave.waveNumber === waveNumber) ?? null;
}
