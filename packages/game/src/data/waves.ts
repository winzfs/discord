import { initialBalance } from "./balance";
import type { WaveDefinition, WaveEnemyGroup } from "../types/wave";

function createNormalWave(waveNumber: number): WaveDefinition {
  const baseCount = 5 + Math.floor(waveNumber * 1.35);
  const enemyGroups: WaveEnemyGroup[] = [
    {
      enemyId: waveNumber >= 7 && waveNumber % 3 === 0 ? "ping-runner" : "bug-grunt",
      count: baseCount,
      spawnIntervalMs: Math.max(420, 980 - waveNumber * 18),
    },
  ];

  if (waveNumber >= 6 && waveNumber % 4 === 0) {
    enemyGroups.push({
      enemyId: "lag-chunk",
      count: Math.max(1, Math.floor(waveNumber / 5)),
      spawnIntervalMs: 1_200,
    });
  }

  if (waveNumber >= 11 && waveNumber % 5 === 1) {
    enemyGroups.push({
      enemyId: "elite-bug",
      count: Math.max(1, Math.floor(waveNumber / 8)),
      spawnIntervalMs: 1_450,
    });
  }

  return {
    id: `wave-${String(waveNumber).padStart(3, "0")}`,
    waveNumber,
    enemyGroups,
    isBossWave: false,
    rewardOnClear: 8 + waveNumber * 2,
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
        count: 3 + Math.floor(waveNumber / 3),
        spawnIntervalMs: 760,
      },
      ...(waveNumber >= 10
        ? [
            {
              enemyId: "lag-chunk",
              count: Math.max(1, Math.floor(waveNumber / 10)),
              spawnIntervalMs: 1_150,
            },
          ]
        : []),
    ],
    isBossWave: true,
    rewardOnClear: 40 + waveNumber * 4,
  };
}

export const waves: WaveDefinition[] = Array.from({ length: initialBalance.maxWave }, (_, index) => {
  const waveNumber = index + 1;
  return waveNumber % initialBalance.bossWaveInterval === 0 ? createBossWave(waveNumber) : createNormalWave(waveNumber);
});

export function getWaveByNumber(waveNumber: number): WaveDefinition | null {
  return waves.find((wave) => wave.waveNumber === waveNumber) ?? null;
}
