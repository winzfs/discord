import { initialBalance } from "./balance";
import type { WaveDefinition, WaveEnemyGroup, WaveTacticalTheme } from "../types/wave";
import type { SkillEffectType } from "../types/skill";

function getNormalWaveTheme(waveNumber: number): WaveTacticalTheme {
  if (waveNumber >= 18 && waveNumber % 2 === 0) return "elite";
  if (waveNumber >= 7 && waveNumber % 3 === 0) return "rush";
  if (waveNumber >= 6 && waveNumber % 4 === 0) return "armored";
  if (waveNumber >= 11 && waveNumber % 5 === 1) return "mixed";
  return "swarm";
}

function getRecommendedEffects(theme: WaveTacticalTheme, isBossWave = false): SkillEffectType[] {
  if (isBossWave) return ["amplify", "damage", "execute", "control"];

  switch (theme) {
    case "rush":
      return ["control", "execute", "chain"];
    case "armored":
      return ["amplify", "damage", "control"];
    case "elite":
      return ["amplify", "execute", "control"];
    case "mixed":
      return ["splash", "control", "amplify"];
    case "swarm":
    default:
      return ["splash", "chain", "tempo"];
  }
}

function getWaveTitle(theme: WaveTacticalTheme, waveNumber: number, isBossWave = false) {
  if (isBossWave) return `W${waveNumber} 서버 크래셔 침공`;
  if (theme === "rush") return `W${waveNumber} 핑러너 돌파`;
  if (theme === "armored") return `W${waveNumber} 렉덩어리 압박`;
  if (theme === "elite") return `W${waveNumber} 엘리트 버그 출현`;
  if (theme === "mixed") return `W${waveNumber} 혼합 웨이브`;
  return `W${waveNumber} 잡버그 무리`;
}

function createNormalWave(waveNumber: number): WaveDefinition {
  const baseCount = 8 + Math.floor(waveNumber * 1.85);
  const theme = getNormalWaveTheme(waveNumber);
  const mainEnemyId = theme === "elite" ? "elite-bug" : theme === "rush" ? "ping-runner" : "bug-grunt";
  const enemyGroups: WaveEnemyGroup[] = [
    {
      enemyId: mainEnemyId,
      count: baseCount,
      spawnIntervalMs: Math.max(260, 760 - waveNumber * 18),
    },
  ];

  if (waveNumber >= 4 && waveNumber % 3 === 1) {
    enemyGroups.push({
      enemyId: "ping-runner",
      count: Math.max(4, Math.floor(waveNumber / 1.9)),
      spawnIntervalMs: Math.max(240, 620 - waveNumber * 8),
    });
  }

  if (waveNumber >= 6 && waveNumber % 4 === 0) {
    enemyGroups.push({
      enemyId: "lag-chunk",
      count: Math.max(2, Math.floor(waveNumber / 3.5)),
      spawnIntervalMs: 920,
    });
  }

  if (waveNumber >= 11 && waveNumber % 5 === 1) {
    enemyGroups.push({
      enemyId: "elite-bug",
      count: Math.max(2, Math.floor(waveNumber / 6)),
      spawnIntervalMs: 1_020,
    });
  }

  if (waveNumber >= 21) {
    enemyGroups.push({
      enemyId: waveNumber % 2 === 0 ? "lag-chunk" : "ping-runner",
      count: Math.max(3, Math.floor(waveNumber / 5)),
      spawnIntervalMs: 720,
    });
  }

  return {
    id: `wave-${String(waveNumber).padStart(3, "0")}`,
    waveNumber,
    title: getWaveTitle(theme, waveNumber),
    tacticalTheme: theme,
    recommendedEffects: getRecommendedEffects(theme),
    enemyGroups,
    isBossWave: false,
    rewardOnClear: 8 + waveNumber * 2,
  };
}

function createBossWave(waveNumber: number): WaveDefinition {
  return {
    id: `wave-${String(waveNumber).padStart(3, "0")}`,
    waveNumber,
    title: getWaveTitle("boss", waveNumber, true),
    tacticalTheme: "boss",
    recommendedEffects: getRecommendedEffects("boss", true),
    enemyGroups: [
      {
        enemyId: "server-crasher",
        count: 1,
        spawnIntervalMs: 1_000,
      },
      {
        enemyId: waveNumber >= 15 ? "ping-runner" : "bug-grunt",
        count: 6 + Math.floor(waveNumber / 2.4),
        spawnIntervalMs: Math.max(300, 600 - waveNumber * 6),
      },
      {
        enemyId: "lag-chunk",
        count: Math.max(2, Math.floor(waveNumber / 6)),
        spawnIntervalMs: 860,
      },
      ...(waveNumber >= 20
        ? [
            {
              enemyId: "elite-bug",
              count: Math.max(2, Math.floor(waveNumber / 10)),
              spawnIntervalMs: 980,
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
