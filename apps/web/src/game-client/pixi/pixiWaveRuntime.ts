import { getWaveByNumber } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { createActiveEnemy, destroyActiveEnemy } from "./pixiEnemyRuntime";

export type SpawnWaveMonstersOptions = {
  showBossWarning: (refs: GameRefs) => void;
  invalidateControls: (refs: GameRefs) => void;
};

function getSpawnProgressGap(spawnIntervalMs: number) {
  return Math.max(0.038, (spawnIntervalMs / 1000) * 0.16);
}

export function spawnWaveMonsters(refs: GameRefs, options: SpawnWaveMonstersOptions) {
  refs.activeEnemies.forEach(destroyActiveEnemy);
  refs.activeEnemies = [];
  refs.nextEnemyLeakAt = 0;
  refs.waveKilled = 0;
  refs.waveReward = 0;
  refs.waveLostLives = 0;

  const wave = getWaveByNumber(refs.state.currentWave);
  if (!wave) return;

  if (wave.isBossWave) {
    options.showBossWarning(refs);
  }

  let spawnIndex = 0;

  for (const group of wave.enemyGroups) {
    const progressGap = getSpawnProgressGap(group.spawnIntervalMs);

    for (let index = 0; index < group.count; index += 1) {
      const enemy = createActiveEnemy(
        refs,
        group.enemyId,
        wave.isBossWave && group.enemyId === "server-crasher",
      );

      if (!enemy) continue;

      enemy.progress = -(spawnIndex * progressGap);
      refs.activeEnemies.push(enemy);
      spawnIndex += 1;
    }
  }

  options.invalidateControls(refs);
}
