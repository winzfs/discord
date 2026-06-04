import { initialBalance } from "./balance";
import type { WaveDefinition, WaveEnemyGroup } from "../types/wave";

function createNormalWave(waveNumber: number): WaveDefinition {
  const baseCount = 6 + Math.floor(waveNumber * 1.55);
  const mainEnemyId = waveNumber >= 18 && waveNumber % 2 === 0 ? "elite-bug" : waveNumber >= 7 && waveNumber % 3 === 0 ? "ping-runner" : "bug-grunt";
  const enemyGroups: WaveEnemyGroup[] = [
    {
      enemyId: mainEnemyId,
      count: baseCount,
      spawnIntervalMs: Math.max(360, 920 - waveNumber * 20),
    },
  ];

  if (waveNumber >= 4 && waveNumber % 3 === 1) {
    enemyGroups.push({
      enemyId: "ping-runner",
      count: Math.max(3, Math.floor(waveNumber / 2)),
      spawnIntervalMs: Math.max(320, 740 - waveNumber * 8),
    });
  }

  if (waveNumber >= 6 && waveNumber % 4 === 0) {
    enemyGroups.push({
      enemyId: "lag-chunk",
      count: Math.max(1, Math.floor(waveNumber / 4)),
      spawnIntervalMs: 1_060,
    });
  }

  if (waveNumber >= 11 && waveNumber % 5 === 1) {
    enemyGroups.push({
      enemyId: "elite-bug",
      count: Math.max(1, Math.floor(waveNumber / 7)),
      spawnIntervalMs: 1_280,
    });
  }

  if (waveNumber >= 21) {
    enemyGroups.push({
      enemyId: waveNumber % 2 === 0 ? "lag-chunk" : "ping-runner",
      count: Math.max(2, Math.floor(waveNumber / 6)),
      spawnIntervalMs: 860,
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
        count: 4 + Math.floor(waveNumber / 2.8),
        spawnIntervalMs: Math.max(440, 720 - waveNumber * 6),
      },
      {
        enemyId: "lag-chunk",
        count: Math.max(1, Math.floor(waveNumber / 8)),
        spawnIntervalMs: 1_050,
      },
      ...(waveNumber >= 20
        ? [
            {
              enemyId: "elite-bug",
              count: Math.max(1, Math.floor(waveNumber / 12)),
              spawnIntervalMs: 1_180,
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
