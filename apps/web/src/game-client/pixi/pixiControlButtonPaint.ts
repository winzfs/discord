import { Graphics } from "pixi.js";

export function paintControlButton(
  graphics: Graphics,
  width: number,
  height: number,
  fill: number,
  disabled: boolean,
  radius: number,
) {
  const base = disabled ? 0x6c635c : fill;
  const border = disabled ? 0x3a332e : 0x34211b;

  graphics.clear();
  graphics.roundRect(4, 7, width, height, radius);
  graphics.fill({ color: 0x000000, alpha: 0.28 });
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: base, alpha: disabled ? 0.9 : 1 });
  graphics.stroke({ color: border, width: 4, alpha: 0.95 });
  graphics.roundRect(8, 6, Math.max(0, width - 16), Math.max(0, height * 0.4), Math.max(4, radius - 7));
  graphics.fill({ color: 0xffffff, alpha: disabled ? 0.05 : 0.16 });
  graphics.roundRect(8, Math.max(8, height - 18), Math.max(0, width - 16), 8, 4);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.08 : 0.1 });
}

export function paintControlDock(graphics: Graphics, x: number, y: number, width: number, height: number) {
  graphics.clear();
  graphics.roundRect(x + 5, y + 8, width, height, 24);
  graphics.fill({ color: 0x000000, alpha: 0.3 });
  graphics.roundRect(x, y, width, height, 24);
  graphics.fill({ color: 0x2c211f, alpha: 0.92 });
  graphics.stroke({ color: 0x1c1210, width: 5, alpha: 0.95 });
  graphics.roundRect(x + 10, y + 8, Math.max(0, width - 20), 24, 12);
  graphics.fill({ color: 0xffffff, alpha: 0.05 });
}
