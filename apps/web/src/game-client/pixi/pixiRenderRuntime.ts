import type { GameLayout } from "./gameLayout";
import type { GameRefs } from "./pixiGameTypes";
import { drawPixiBackgroundView } from "./pixiBackgroundView";
import { getPixiPathPoint } from "./pixiPathRuntime";

export function drawBackground(refs: GameRefs, layout: GameLayout) {
  drawPixiBackgroundView(refs.world, layout, getPixiPathPoint);
}
