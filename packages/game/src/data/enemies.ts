import type { EnemyDefinition } from "../types/enemy";

export const enemies: EnemyDefinition[] = [
  { id: "training-bot", displayName: "훈련 봇", type: "basic", assetKey: "enemy.placeholder", health: 100, reward: 5, tags: ["basic"] },
  { id: "elite-bot", displayName: "정예 봇", type: "elite", assetKey: "enemy.placeholder", health: 300, reward: 15, tags: ["elite"] },
  { id: "boss-bot", displayName: "보스 봇", type: "boss", assetKey: "boss.placeholder", health: 1200, reward: 100, tags: ["boss"] },
];
