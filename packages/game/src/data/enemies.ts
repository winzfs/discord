import type { EnemyDefinition } from "../types/enemy";

export const enemies: EnemyDefinition[] = [
  {
    id: "bug-grunt",
    displayName: "잡버그",
    type: "basic",
    assetKey: "enemy.placeholder",
    health: 100,
    speed: 1,
    reward: 5,
    damageToLife: 1,
    tags: ["basic"],
  },
  {
    id: "ping-runner",
    displayName: "핑러너",
    type: "fast",
    assetKey: "enemy.placeholder",
    health: 75,
    speed: 1.5,
    reward: 6,
    damageToLife: 1,
    tags: ["fast"],
  },
  {
    id: "lag-chunk",
    displayName: "렉덩어리",
    type: "tank",
    assetKey: "enemy.placeholder",
    health: 260,
    speed: 0.75,
    reward: 12,
    damageToLife: 2,
    tags: ["tank"],
  },
  {
    id: "server-crasher",
    displayName: "서버크래셔",
    type: "boss",
    assetKey: "boss.placeholder",
    health: 1_200,
    speed: 0.65,
    reward: 100,
    damageToLife: 5,
    tags: ["boss"],
  },
];

export function getEnemyById(enemyId: string): EnemyDefinition | null {
  return enemies.find((enemy) => enemy.id === enemyId) ?? null;
}
