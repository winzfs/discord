import {
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_RENDER_SCALE_MAX,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { getHeroStrikeRenderScaleLimit } from "./heroStrikePerformance";

export function configureHeroStrikeCanvas(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
  const qualityLimit = Math.min(HERO_STRIKE_RENDER_SCALE_MAX, getHeroStrikeRenderScaleLimit());
  const pixelRatio = Math.min(qualityLimit, devicePixelRatio);
  const width = Math.round(HERO_STRIKE_WIDTH * pixelRatio);
  const height = Math.round(HERO_STRIKE_HEIGHT * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
}
