import { getHeroById, placeHeroOnBoard } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import {
  getHeroSpriteDefaultScale,
  getHeroSpriteScale,
  resetHeroSpriteScaleOverride,
  setHeroSpriteScaleOverride,
} from "./pixiHeroSpriteView";
import {
  resetHeroSpriteScaleOverrideOnServer,
  saveHeroSpriteScaleOverrideToServer,
} from "./pixiHeroSpriteScaleApi";

export const pixiTestHeroIds = [
  "spark-runner",
  "rookie-guard",
  "mini-mender",
  "scrap-gunner",
  "slow-bot",
  "charge-helper",
  "pulse-ranger",
  "barrier-guard",
  "field-medic",
  "frost-warden",
  "burst-scout",
  "nano-aide",
  "plasma-mage",
  "core-knight",
  "overclock-tech",
  "arc-captain",
  "gravity-jailer",
  "combat-engineer",
  "credit-hacker",
  "railgun-ace",
  "last-bastion",
  "orbital-sniper",
  "aegis-commander",
  "chrono-oracle",
  "dva",
  "zarya",
  "winston",
  "tracer",
  "cassidy",
  "genji",
  "ana",
  "kiriko",
  "illari",
] as const;

export const pixiTestMythicHeroIds = [
  "dva",
  "zarya",
  "winston",
  "tracer",
  "cassidy",
  "genji",
  "ana",
  "kiriko",
  "illari",
] as const;

export const pixiTestEnemyHpMultipliers = [0.5, 1, 2, 5, 10, 50, 100] as const;

export type PixiTestHeroId = (typeof pixiTestHeroIds)[number];
export type PixiTestMythicHeroId = (typeof pixiTestMythicHeroIds)[number];
export type PixiTestEnemyHpMultiplier = (typeof pixiTestEnemyHpMultipliers)[number];

export function getPixiTestHeroScale(heroId: string | null | undefined) {
  if (!heroId) return null;
  const definition = getHeroById(heroId);
  return {
    heroId,
    displayName: definition?.displayName ?? heroId,
    defaultScale: getHeroSpriteDefaultScale(heroId),
    scale: getHeroSpriteScale(heroId),
  };
}

export function adjustPixiTestHeroScale(heroId: string | null | undefined, delta: number) {
  const selected = getPixiTestHeroScale(heroId);
  if (!selected) return null;
  const nextScale = setHeroSpriteScaleOverride(selected.heroId, selected.scale + delta);
  void saveHeroSpriteScaleOverrideToServer(selected.heroId, nextScale).catch(() => undefined);
  return {
    ...selected,
    scale: nextScale,
  };
}

export function resetPixiTestHeroScale(heroId: string | null | undefined) {
  const selected = getPixiTestHeroScale(heroId);
  if (!selected) return null;
  const nextScale = resetHeroSpriteScaleOverride(selected.heroId);
  void resetHeroSpriteScaleOverrideOnServer(selected.heroId).catch(() => undefined);
  return {
    ...selected,
    scale: nextScale,
  };
}

export function summonPixiTestHero(refs: GameRefs, heroId: string) {
  const definition = getHeroById(heroId);
  if (!definition) return null;

  const boardHero = {
    instanceId: `test-${heroId}-${Date.now()}-${Math.floor(refs.random() * 10000)}`,
    heroId,
    grade: definition.grade,
  } satisfies Omit<BoardHero, "position">;

  const placement = placeHeroOnBoard(refs.state, boardHero);
  refs.state = placement.state;
  refs.lastSummonedIndex = placement.placedHero
    ? placement.placedHero.position.row * refs.state.boardSize.columns + placement.placedHero.position.column
    : refs.lastSummonedIndex;

  return placement.placedHero;
}

export function summonPixiTestMythicHero(refs: GameRefs, heroId: PixiTestMythicHeroId) {
  const definition = getHeroById(heroId);
  if (!definition || definition.grade !== "mythic") return null;
  return summonPixiTestHero(refs, heroId);
}

export function setPixiTestEnemyHpMultiplier(refs: GameRefs, multiplier: PixiTestEnemyHpMultiplier) {
  refs.testEnemyHpMultiplier = multiplier;
  return refs.testEnemyHpMultiplier;
}
