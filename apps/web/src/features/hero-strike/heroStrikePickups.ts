import type { HeroStrikeEnemy, HeroStrikeState, PickupKind } from "./heroStrikeTypes";

const PICKUP_VALUES: Record<Exclude<PickupKind, "xp">, number> = {
  heal: 1,
  charge: 28,
  shield: 1,
  bomb: 1,
  overdrive: 6,
  "support-drone": 18,
  "time-warp": 9,
  "xp-core": 45,
};

export function spawnHeroStrikePickup(
  state: HeroStrikeState,
  kind: PickupKind,
  x: number,
  y: number,
  value = kind === "xp" ? 2 : PICKUP_VALUES[kind],
) {
  const special = kind !== "xp";
  state.pickups.push({
    id: state.nextId++,
    kind,
    x,
    y,
    vx: (Math.random() - 0.5) * (special ? 58 : 95),
    vy: -45 - Math.random() * (special ? 42 : 75),
    value,
    radius: kind === "xp-core" ? 11 : special ? 9 : 6,
    life: special ? 11 : 8,
  });
}

export function spawnEnemyXp(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  const count = enemy.boss ? 15 : enemy.kind === "bomber" ? 4 : enemy.kind === "tank" ? 3 : enemy.kind === "sniper" ? 2 : 1;
  for (let index = 0; index < count; index += 1) {
    spawnHeroStrikePickup(state, "xp", enemy.x, enemy.y, Math.max(2, Math.round(enemy.reward / count)));
  }
}

export function maybeSpawnBonusPickup(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  if (enemy.boss) return;
  const rarityMultiplier = enemy.kind === "bomber"
    ? 2.25
    : enemy.kind === "tank"
      ? 1.85
      : enemy.kind === "sniper"
        ? 1.4
        : enemy.kind === "drone" || enemy.kind === "weaver"
          ? 1.2
          : 1;
  const roll = Math.random() / rarityMultiplier;

  let kind: Exclude<PickupKind, "xp"> | null = null;
  if (state.player.hp < state.player.maxHp && roll < 0.025) kind = "heal";
  else if (roll < 0.058) kind = "charge";
  else if (roll < 0.082) kind = "shield";
  else if (roll < 0.104) kind = "overdrive";
  else if (roll < 0.126) kind = "support-drone";
  else if (roll < 0.142) kind = "time-warp";
  else if (roll < 0.162) kind = "xp-core";
  else if (roll < 0.174) kind = "bomb";

  if (kind) spawnHeroStrikePickup(state, kind, enemy.x, enemy.y);
}

export function spawnStageReward(state: HeroStrikeState, clearedStageIndex: number) {
  const rewards: readonly Exclude<PickupKind, "xp" | "heal" | "xp-core">[] = [
    "support-drone",
    "shield",
    "time-warp",
    "bomb",
    "charge",
    "overdrive",
  ];
  const kind = rewards[Math.max(0, Math.min(rewards.length - 1, clearedStageIndex))];
  spawnHeroStrikePickup(state, kind, 210, 205);
}