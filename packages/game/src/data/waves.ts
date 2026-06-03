import type { WaveDefinition } from "../types/wave";

export const waves: WaveDefinition[] = [
  { id: "wave-001", waveNumber: 1, enemyId: "training-bot", enemyCount: 12, isBossWave: false },
  { id: "wave-005", waveNumber: 5, enemyId: "boss-bot", enemyCount: 1, isBossWave: true },
];
