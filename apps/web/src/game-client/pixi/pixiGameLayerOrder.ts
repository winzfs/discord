import type { Container } from "pixi.js";

export type PixiGameLayers = {
  world: Container;
  board: Container;
  hud: Container;
  controls: Container;
  info: Container;
  effects: Container;
  menuLayer: Container;
};

export function mountPixiGameLayers(stage: Container, layers: PixiGameLayers) {
  stage.addChild(
    layers.world,
    layers.board,
    layers.hud,
    layers.controls,
    layers.info,
    layers.effects,
    layers.menuLayer,
  );
}
