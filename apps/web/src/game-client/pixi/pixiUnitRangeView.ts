import { Container, Graphics } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { getCellCenter } from "./pixiBoardRuntime";
import { getPixiUnitAttackRange } from "./pixiUnitRange";
import { isBuffSupportHero } from "./pixiHeroSynergyRuntime";

function getRangeColor(hero: BoardHero) {
  if (hero.grade === "mythic") return 0xffd166;
  if (hero.grade === "legendary") return 0xff8f70;
  if (hero.grade === "epic") return 0xb58cff;
  if (hero.grade === "rare") return 0x70b7ff;
  return 0xffffff;
}

function drawSupportSynergyCells(refs: GameRefs, preview: Container, cellIndex: number, cellSize: number) {
  const sourceRow = Math.floor(cellIndex / refs.state.boardSize.columns);
  const sourceColumn = cellIndex % refs.state.boardSize.columns;

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;

      const row = sourceRow + rowOffset;
      const column = sourceColumn + columnOffset;
      if (row < 0 || column < 0 || row >= refs.state.boardSize.rows || column >= refs.state.boardSize.columns) continue;

      const targetIndex = row * refs.state.boardSize.columns + column;
      const center = getCellCenter(refs, targetIndex);
      const marker = new Graphics();
      const size = cellSize * 0.74;

      marker.roundRect(center.x - size / 2, center.y - size / 2, size, size, 10);
      marker.fill({ color: 0x7dffb2, alpha: 0.1 });
      marker.stroke({ color: 0x7dffb2, width: 2, alpha: 0.42 });
      preview.addChild(marker);
    }
  }
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

  if (isBuffSupportHero(hero)) {
    drawSupportSynergyCells(refs, preview, cellIndex, center.cell);
  }

  refs.rangePreview = preview;
  refs.effects.addChild(preview);
}
