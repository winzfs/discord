import { Assets, Container, Graphics, Sprite, Texture } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { FIELD_TEXTURE_PATH, getPixiFieldCoverFrame } from "./pixiFieldFrame";

export type PixiPathPointResolver = (layout: GameLayout, progress: number) => { x: number; y: number };

let fieldTexture: Texture | null = null;
let fieldTextureLoading = false;

function requestFieldTexture(world: Container, layout: GameLayout) {
  if (fieldTexture || fieldTextureLoading) return;

  fieldTextureLoading = true;
  void Assets.load<Texture>(FIELD_TEXTURE_PATH)
    .then((texture) => {
      fieldTexture = texture;
      fieldTextureLoading = false;
      drawPixiBackgroundView(world, layout, () => ({ x: 0, y: 0 }));
    })
    .catch(() => {
      fieldTextureLoading = false;
    });
}

export function drawPixiBackgroundView(world: Container, layout: GameLayout, _getPathPoint: PixiPathPointResolver) {
  world.removeChildren();

  const fallback = new Graphics();
  fallback.rect(0, 0, layout.width, layout.height);
  fallback.fill(colors.sky);
  world.addChild(fallback);

  if (!fieldTexture) {
    requestFieldTexture(world, layout);
    return;
  }

  const frame = getPixiFieldCoverFrame(layout.width, layout.height);
  const field = new Sprite(fieldTexture);
  field.x = frame.x;
  field.y = frame.y;
  field.width = frame.width;
  field.height = frame.height;
  world.addChild(field);
}
