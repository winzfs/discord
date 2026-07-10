import type { HeroStrikeEnemy, HeroStrikeState, PickupKind } from "./heroStrikeTypes";

const PICKUP_VALUES: Record<Exclude<PickupKind, "xp">, number> = {
  heal: 1,
  charge: 28,
  shield: 1,
  bomb: 1,
  overdrive: 6,
  missile: 15,
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

  // 첫 플레이에서도 신규 보조무기를 확실히 체험할 수 있게 1스테이지 8번째 처치에 확정 지급한다.
  if (state.stageIndex === 0 && state.kills === 8) {
    spawnHeroStrikePickup(state, "missile", enemy.x, enemy.y);
    return;
  }

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
  if (state.player.hp < state.player.maxHp && roll < 0.023) kind = "heal";
  else if (roll < 0.052) kind = "charge";
  else if (roll < 0.074) kind = "shield";
  else if (roll < 0.092) kind = "overdrive";
  else if (roll < 0.112) kind = "missile";
  else if (roll < 0.128) kind = "support-drone";
  else if (roll < 0.14) kind = "time-warp";
  else if (roll < 0.158) kind = "xp-core";
  else if (roll < 0.168) kind = "bomb";

  if (kind) spawnHeroStrikePickup(state, kind, enemy.x, enemy.y);
}

export function spawnStageReward(state: HeroStrikeState, clearedStageIndex: number) {
  const rewards: readonly Exclude<PickupKind, "xp" | "heal" | "xp-core">[] = [
    "missile",
    "support-drone",
    "shield",
    "time-warp",
    "bomb",
    "charge",
  ];
  const kind = rewards[Math.max(0, Math.min(rewards.length - 1, clearedStageIndex))];
  spawnHeroStrikePickup(state, kind, 210, 205);
}
