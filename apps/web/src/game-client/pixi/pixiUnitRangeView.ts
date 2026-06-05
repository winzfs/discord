import { Container, Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { getCellCenter } from "./pixiBoardRuntime";
import { getPixiUnitAttackRange } from "./pixiUnitRange";

function getRangeColor(hero: BoardHero) {
  if (hero.grade === "mythic") return 0xffd166;
  if (hero.grade === "legendary") return 0xff8f70;
  if (hero.grade === "epic") return 0xb58cff;
  if (hero.grade === "rare") return 0x70b7ff;
  return 0xffffff;
}

export function clearPixiUnitRangePreview(refs: GameRefs) {
  refs.rangePreview?.destroy({ children: true });
  refs.rangePreview = null;
}

export function drawPixiUnitRangePreview(refs: GameRefs, cellIndex: number, hero: BoardHero) {
  clearPixiUnitRangePreview(refs);

  const center = getCellCenter(refs, cellIndex);
  const radius = getPixiUnitAttackRange(hero);
  const preview = new Container();
  const circle = new Graphics();

  circle.circle(center.x, center.y, radius);
  circle.fill({ color: getRangeColor(hero), alpha: 0.08 });
  circle.stroke({ color: getRangeColor(hero), width: 2, alpha: 0.36 });
  preview.addChild(circle);

  refs.rangePreview = preview;
  refs.effects.addChild(preview);
}
