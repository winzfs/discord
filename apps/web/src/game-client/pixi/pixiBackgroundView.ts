import { Container, Graphics } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { makePixiPanel } from "./pixiSharedView";

export type PixiPathPointResolver = (layout: GameLayout, progress: number) => { x: number; y: number };

export function drawPixiBackgroundView(world: Container, layout: GameLayout, getPathPoint: PixiPathPointResolver) {
  world.removeChildren();

  const background = new Graphics();
  background.rect(0, 0, layout.width, layout.height);
  background.fill(colors.sky);
  world.addChild(background);

  const road = new Graphics();
  const first = getPathPoint(layout, 0);
  road.moveTo(first.x, first.y);
  for (let index = 1; index <= 96; index += 1) {
    const point = getPathPoint(layout, index / 96);
    road.lineTo(point.x, point.y);
  }
  road.stroke({ color: colors.dirtDark, width: 42, alpha: 1 });
  road.stroke({ color: colors.dirt, width: 34, alpha: 1 });
  world.addChild(road);

  const boardShadow = makePixiPanel(layout.boardWidth + 14, layout.boardHeight + 14, colors.wood, 0x4f3424, 18);
  boardShadow.x = layout.boardX - 7;
  boardShadow.y = layout.boardY - 7;
  world.addChild(boardShadow);

  const field = makePixiPanel(layout.boardWidth, layout.boardHeight, colors.field, 0x4f7d2a, 16);
  field.x = layout.boardX;
  field.y = layout.boardY;
  world.addChild(field);
}
