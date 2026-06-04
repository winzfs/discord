import { Container, Graphics, Sprite, Texture } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { FIELD_TEXTURE_PATH, getPixiFieldCoverFrame } from "./pixiFieldFrame";

export type PixiPathPointResolver = (layout: GameLayout, progress: number) => { x: number; y: number };

export function drawPixiBackgroundView(world: Container, layout: GameLayout, _getPathPoint: PixiPathPointResolver) {
  world.removeChildren();

  const fallback = new Graphics();
  fallback.rect(0, 0, layout.width, layout.height);
  fallback.fill(colors.sky);
  world.addChild(fallback);

  const frame = getPixiFieldCoverFrame(layout.width, layout.height);
  const field = new Sprite(Texture.from(FIELD_TEXTURE_PATH));
  field.x = frame.x;
  field.y = frame.y;
  field.width = frame.width;
  field.height = frame.height;
  world.addChild(field);
}
