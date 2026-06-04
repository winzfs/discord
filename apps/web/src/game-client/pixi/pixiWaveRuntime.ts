import { getWaveByNumber } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { createActiveEnemy, destroyActiveEnemy } from "./pixiEnemyRuntime";

export type SpawnWaveMonstersOptions = {
  showBossWarning: (refs: GameRefs) => void;
  invalidateControls: (refs: GameRefs) => void;
};

export function spawnWaveMonsters(refs: GameRefs, options: SpawnWaveMonstersOptions) {
  refs.activeEnemies.forEach(destroyActiveEnemy);
  refs.activeEnemies = [];
  refs.waveKilled = 0;
  refs.waveReward = 0;
  refs.waveLostLives = 0;

  const wave = getWaveByNumber(refs.state.currentWave);
  if (!wave) return;

  if (wave.isBossWave) {
    options.showBossWarning(refs);
  }

  for (const group of wave.enemyGroups) {
    for (let index = 0; index < group.count; index += 1) {
      const enemy = createActiveEnemy(
        refs,
        group.enemyId,
        wave.isBossWave && group.enemyId === "server-crasher",
      );

      if (!enemy) continue;

      enemy.progress = -((group.spawnIntervalMs / 1000) * index * 0.075);
      refs.activeEnemies.push(enemy);
    }
  }

  options.invalidateControls(refs);
}
