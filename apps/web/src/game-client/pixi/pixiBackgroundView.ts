import { Container, Graphics, Sprite, Texture } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";

export type PixiPathPointResolver = (layout: GameLayout, progress: number) => { x: number; y: number };

const FIELD_TEXTURE_PATH = "/assets/field.png";
const FIELD_SOURCE_WIDTH = 864;
const FIELD_SOURCE_HEIGHT = 1536;

function getFieldFrame(layout: GameLayout) {
  const scale = Math.max(layout.width / FIELD_SOURCE_WIDTH, layout.height / FIELD_SOURCE_HEIGHT);
  const width = FIELD_SOURCE_WIDTH * scale;
  const height = FIELD_SOURCE_HEIGHT * scale;

  return {
    x: (layout.width - width) / 2,
    y: (layout.height - height) / 2,
    width,
    height,
  };
}

export function drawPixiBackgroundView(world: Container, layout: GameLayout, _getPathPoint: PixiPathPointResolver) {
  world.removeChildren();

  const fallback = new Graphics();
  fallback.rect(0, 0, layout.width, layout.height);
  fallback.fill(colors.sky);
  world.addChild(fallback);

  const frame = getFieldFrame(layout);
  const field = new Sprite(Texture.from(FIELD_TEXTURE_PATH));
  field.x = frame.x;
  field.y = frame.y;
  field.width = frame.width;
  field.height = frame.height;
  world.addChild(field);
}
