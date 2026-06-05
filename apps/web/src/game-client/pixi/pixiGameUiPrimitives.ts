import { Graphics } from "pixi.js";

type ButtonPaintOptions = {
  width: number;
  height: number;
  radius: number;
  fill: number;
  stroke: number;
  disabled?: boolean;
  highlight?: number;
};

export function drawGamePanel(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: number,
  stroke: number,
  alpha = 1,
) {
  graphics.clear();
  graphics.roundRect(x + 4, y + 7, width, height, radius);
  graphics.fill({ color: 0x000000, alpha: 0.24 * alpha });
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill({ color: fill, alpha });
  graphics.stroke({ color: stroke, width: 4, alpha: 0.95 * alpha });
  graphics.roundRect(x + 7, y + 6, Math.max(0, width - 14), Math.max(0, height * 0.38), Math.max(4, radius - 5));
  graphics.fill({ color: 0xffffff, alpha: 0.09 * alpha });
}

export function drawGameButton(graphics: Graphics, options: ButtonPaintOptions) {
  const { width, height, radius, fill, stroke, disabled = false, highlight = 0xffffff } = options;
  const base = disabled ? 0x6c635c : fill;
  const border = disabled ? 0x3a332e : stroke;
  const alpha = disabled ? 0.9 : 1;

  graphics.clear();
  graphics.roundRect(4, 7, width, height, radius);
  graphics.fill({ color: 0x000000, alpha: 0.28 * alpha });
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: base, alpha });
  graphics.stroke({ color: border, width: 4, alpha: 0.95 });
  graphics.roundRect(8, 6, Math.max(0, width - 16), Math.max(0, height * 0.4), Math.max(4, radius - 7));
  graphics.fill({ color: highlight, alpha: disabled ? 0.05 : 0.16 });
  graphics.roundRect(8, Math.max(8, height - 18), Math.max(0, width - 16), 8, 4);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.08 : 0.1 });
}

export function drawSegmentedBar(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  ratio: number,
  fill: number,
  back = 0x3b2024,
) {
  const clamped = Math.max(0, Math.min(1, ratio));
  graphics.clear();
  graphics.roundRect(x + 3, y + 5, width, height, height / 2);
  graphics.fill({ color: 0x000000, alpha: 0.24 });
  graphics.roundRect(x, y, width, height, height / 2);
  graphics.fill({ color: back, alpha: 1 });
  graphics.stroke({ color: 0x2a171a, width: 4, alpha: 0.95 });

  const fillWidth = Math.max(height, (width - 8) * clamped);
  graphics.roundRect(x + 4, y + 4, fillWidth, height - 8, (height - 8) / 2);
  graphics.fill({ color: fill, alpha: 1 });
  graphics.roundRect(x + 8, y + 6, Math.max(0, fillWidth - 8), Math.max(0, (height - 8) * 0.32), 6);
  graphics.fill({ color: 0xffffff, alpha: 0.16 });
}
