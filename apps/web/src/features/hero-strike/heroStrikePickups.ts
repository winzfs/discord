import type { HeroStrikeEnemy, HeroStrikeState, PickupKind } from "./heroStrikeTypes";

const PICKUP_VALUES: Record<Exclude<PickupKind, "xp">, number> = {
  heal: 1,
  charge: 28,
  shield: 1,
  bomb: 1,
  overdrive: 6,
  "xp-core": 45,
};

export function spawnHeroStrikePickup(
  state: HeroStrikeState,
  kind: PickupKind,
  x: number,
  y: number,
  value = kind === "xp" ? 2 : PICKUP_VALUES[kind],
) {
  const xp = kind === "xp";
  const special = !xp;
  state.pickups.push({
    id: state.nextId++,
    kind,
    x,
    y,
    vx: (Math.random() - 0.5) * (special ? 58 : 34),
    vy: xp ? 58 + Math.random() * 34 : -45 - Math.random() * 42,
    value,
    radius: kind === "xp-core" ? 11 : special ? 9 : 6,
    life: xp ? 12 : 11,
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
  if (state.player.hp < state.player.maxHp && roll < 0.024) kind = "heal";
  else if (roll < 0.058) kind = "charge";
  else if (roll < 0.082) kind = "shield";
  else if (roll < 0.108) kind = "overdrive";
  else if (roll < 0.142) kind = "xp-core";
  else if (roll < 0.154) kind = "bomb";

  if (kind) spawnHeroStrikePickup(state, kind, enemy.x, enemy.y);
}

export function spawnStageReward(state: HeroStrikeState, clearedStageIndex: number) {
  const rewards: readonly Exclude<PickupKind, "xp" | "heal">[] = [
    "shield",
    "charge",
    "xp-core",
    "bomb",
    "overdrive",
    "shield",
    "charge",
    "xp-core",
    "bomb",
  ];
  const kind = rewards[Math.max(0, Math.min(rewards.length - 1, clearedStageIndex))];
  spawnHeroStrikePickup(state, kind, 210, 205);
}
