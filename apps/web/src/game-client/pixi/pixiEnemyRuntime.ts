import { getEnemyById } from "@discord-random-defense/game";
import type { ActiveEnemy, GameRefs } from "./pixiGameTypes";
import { createEnemyView, destroyEnemyView, updateEnemyViewHp } from "./pixiEnemyView";

export function createActiveEnemy(
  refs: Pick<GameRefs, "effects" | "nextEnemyId" | "state" | "testEnemyHpMultiplier">,
  enemyId: string,
  bossOverride = false,
): ActiveEnemy | null {
  const definition = getEnemyById(enemyId);
  if (!definition) return null;

  const boss = bossOverride || definition.type === "boss";
  const wave = refs.state.currentWave;
  const hpScale = 0.68 + wave * 0.11 + (boss ? wave * 0.16 : 0);
  const testMultiplier = Math.max(0.1, refs.testEnemyHpMultiplier || 1);
  const maxHp = Math.round(definition.health * hpScale * testMultiplier);
  const view = createEnemyView(enemyId, definition.type, boss);

  refs.effects.addChild(view.root);

  const enemy: ActiveEnemy = {
    id: refs.nextEnemyId,
    enemyId,
    x: 0,
    y: 0,
    hp: maxHp,
    maxHp,
    reward: definition.reward,
    damageToLife: definition.damageToLife,
    progress: 0,
    speed: definition.speed * (boss ? 0.72 : 1),
    alive: true,
    boss,
    view,
  };

  refs.nextEnemyId += 1;
  updateEnemyViewHp(view, enemy.hp, enemy.maxHp);

  return enemy;
}

export function destroyActiveEnemy(enemy: ActiveEnemy) {
  destroyEnemyView(enemy.view);
}
