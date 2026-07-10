import { HERO_STRIKE_TRACER_ASSET } from "./heroStrikeConfig";

let tracerImage: HTMLImageElement | null = null;

export function preloadHeroStrikeAssets() {
  if (tracerImage) return;
  tracerImage = new Image();
  tracerImage.src = HERO_STRIKE_TRACER_ASSET;
}

export function getTracerImage() {
  return tracerImage;
}
