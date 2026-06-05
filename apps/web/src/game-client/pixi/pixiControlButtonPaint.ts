import { Graphics } from "pixi.js";

export function paintControlButton(
  graphics: Graphics,
  width: number,
  height: number,
  fill: number,
  disabled: boolean,
  radius: number,
) {
  const base = disabled ? 0x645e57 : fill;
  const border = disabled ? 0x342d28 : 0x34211b;

  graphics.clear();
  graphics.roundRect(3, 6, width, height, radius);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.18 : 0.26 });
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: base, alpha: disabled ? 0.86 : 1 });
  graphics.stroke({ color: border, width: 4, alpha: 0.92 });
  graphics.roundRect(8, 6, Math.max(0, width - 16), Math.max(0, height * 0.32), Math.max(4, radius - 7));
  graphics.fill({ color: 0xffffff, alpha: disabled ? 0.14 : 0.18 });
  graphics.roundRect(8, Math.max(8, height - 15), Math.max(0, width - 16), 6, 4);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.03 : 0.09 });
}

export function paintControlDock(graphics: Graphics, x: number, y: number, width: number, height: number) {
  graphics.clear();
  graphics.roundRect(x + 4, y + 7, width, height, 24);
  graphics.fill({ color: 0x000000, alpha: 0.24 });
  graphics.roundRect(x, y, width, height, 24);
  graphics.fill({ color: 0x211816, alpha: 0.78 });
  graphics.stroke({ color: 0x100b0a, width: 4, alpha: 0.88 });
  graphics.roundRect(x + 9, y + 7, Math.max(0, width - 18), Math.max(0, height * 0.22), 15);
  graphics.fill({ color: 0xffffff, alpha: 0.04 });
}
