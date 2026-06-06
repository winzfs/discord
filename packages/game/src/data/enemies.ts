import type { EnemyDefinition } from "../types/enemy";

export const enemies: EnemyDefinition[] = [
  {
    id: "bug-grunt",
    displayName: "잡버그",
    type: "basic",
    assetKey: "enemy.placeholder",
    health: 320,
    speed: 0.86,
    reward: 4,
    damageToLife: 1,
    tags: ["basic", "early"],
  },
  {
    id: "ping-runner",
    displayName: "핑러너",
    type: "fast",
    assetKey: "enemy.placeholder",
    health: 260,
    speed: 1.26,
    reward: 5,
    damageToLife: 1,
    tags: ["fast", "rush"],
  },
  {
    id: "lag-chunk",
    displayName: "렉덩어리",
    type: "tank",
    assetKey: "enemy.placeholder",
    health: 1100,
    speed: 0.62,
    reward: 11,
    damageToLife: 2,
    tags: ["tank", "slow"],
  },
  {
    id: "elite-bug",
    displayName: "엘리트버그",
    type: "elite",
    assetKey: "enemy.placeholder",
    health: 2100,
    speed: 0.78,
    reward: 22,
    damageToLife: 3,
    tags: ["elite", "midboss"],
  },
  {
    id: "server-crasher",
    displayName: "서버크래셔",
    type: "boss",
    assetKey: "boss.placeholder",
    health: 7600,
    speed: 0.52,
    reward: 85,
    damageToLife: 8,
    tags: ["boss"],
  },
];

export function getEnemyById(enemyId: string): EnemyDefinition | null {
  return enemies.find((enemy) => enemy.id === enemyId) ?? null;
}
