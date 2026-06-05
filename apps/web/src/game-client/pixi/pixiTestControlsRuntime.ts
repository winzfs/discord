import { getHeroById, placeHeroOnBoard } from "@discord-random-defense/game";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";

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

export const pixiTestEnemyHpMultipliers = [0.5, 1, 2, 5, 10] as const;

export type PixiTestMythicHeroId = (typeof pixiTestMythicHeroIds)[number];
export type PixiTestEnemyHpMultiplier = (typeof pixiTestEnemyHpMultipliers)[number];

export function summonPixiTestMythicHero(refs: GameRefs, heroId: PixiTestMythicHeroId) {
  const definition = getHeroById(heroId);
  if (!definition || definition.grade !== "mythic") return null;

  const boardHero = {
    instanceId: `test-${heroId}-${Date.now()}-${Math.floor(refs.random() * 10000)}`,
    heroId,
    grade: "mythic",
  } satisfies Omit<BoardHero, "position">;

  const placement = placeHeroOnBoard(refs.state, boardHero);
  refs.state = placement.state;
  refs.lastSummonedIndex = placement.placedHero
    ? placement.placedHero.position.row * refs.state.boardSize.columns + placement.placedHero.position.column
    : refs.lastSummonedIndex;

  return placement.placedHero;
}

export function setPixiTestEnemyHpMultiplier(refs: GameRefs, multiplier: PixiTestEnemyHpMultiplier) {
  refs.testEnemyHpMultiplier = multiplier;
  return refs.testEnemyHpMultiplier;
}
