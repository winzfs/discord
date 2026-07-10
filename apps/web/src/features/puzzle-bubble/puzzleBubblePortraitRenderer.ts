export function drawCrispHeroPortrait(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  diameter: number,
) {
  const frameHeight = image.naturalHeight / 4;
  const ratio = Math.max(diameter / image.naturalWidth, diameter / frameHeight);
  const width = Math.ceil(image.naturalWidth * ratio);
  const height = Math.ceil(frameHeight * ratio);
  const targetX = Math.round(centerX - width / 2);
  const targetY = Math.round(centerY - height * .48);

  context.save();
  context.imageSmoothingEnabled = false;
  context.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    frameHeight,
    targetX,
    targetY,
    width,
    height,
  );
  context.restore();
}
