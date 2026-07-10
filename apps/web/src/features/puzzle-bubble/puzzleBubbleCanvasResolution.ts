import { PUZZLE_HEIGHT, PUZZLE_WIDTH } from "./puzzleBubbleConfig";

const MAX_PIXEL_RATIO = 3;

export function configurePuzzleCanvasResolution(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const pixelRatio = Math.min(MAX_PIXEL_RATIO, Math.max(1, window.devicePixelRatio || 1));
  const width = Math.round(PUZZLE_WIDTH * pixelRatio);
  const height = Math.round(PUZZLE_HEIGHT * pixelRatio);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  return pixelRatio;
}
