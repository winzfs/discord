import { getWaveByNumber } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { createActiveEnemy } from "./pixiEnemyRuntime";

export type SpawnWaveMonstersOptions = {
  showBossWarning: (refs: GameRefs) => void;
  invalidateControls: (refs: GameRefs) => void;
};

function getSpawnProgressGap(spawnIntervalMs: number) {
  return Math.max(0.018, (spawnIntervalMs / 1000) * 0.09);
}

export function spawnWaveMonsters(refs: GameRefs, options: SpawnWaveMonstersOptions) {
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
