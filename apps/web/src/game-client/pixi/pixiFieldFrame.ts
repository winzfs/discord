export const FIELD_TEXTURE_PATH = "/assets/field.png";
export const FIELD_SOURCE_WIDTH = 864;
export const FIELD_SOURCE_HEIGHT = 1536;

export type PixiFieldFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
};

export function getPixiFieldCoverFrame(width: number, height: number): PixiFieldFrame {
  const scale = Math.max(width / FIELD_SOURCE_WIDTH, height / FIELD_SOURCE_HEIGHT);
  const frameWidth = FIELD_SOURCE_WIDTH * scale;
  const frameHeight = FIELD_SOURCE_HEIGHT * scale;

  return {
    x: (width - frameWidth) / 2,
    y: (height - frameHeight) / 2,
    width: frameWidth,
    height: frameHeight,
    scale,
  };
}
