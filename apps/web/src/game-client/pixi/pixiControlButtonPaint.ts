import { Graphics } from "pixi.js";

export function paintControlButton(
  graphics: Graphics,
  width: number,
  height: number,
  fill: number,
  disabled: boolean,
  radius: number,
) {
  const base = disabled ? 0x5c544f : fill;
  const border = disabled ? 0x312a26 : 0x34211b;

  graphics.clear();
  graphics.roundRect(4, 7, width, height, radius);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.22 : 0.3 });
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: base, alpha: disabled ? 0.82 : 1 });
  graphics.stroke({ color: border, width: 4, alpha: 0.95 });
  graphics.roundRect(8, 6, Math.max(0, width - 16), Math.max(0, height * 0.34), Math.max(4, radius - 7));
  graphics.fill({ color: 0xffffff, alpha: disabled ? 0.1 : 0.18 });
  graphics.roundRect(8, Math.max(8, height - 16), Math.max(0, width - 16), 7, 4);
  graphics.fill({ color: 0x000000, alpha: disabled ? 0.04 : 0.1 });
}

export function paintControlDock(graphics: Graphics, x: number, y: number, width: number, height: number) {
  graphics.clear();
  graphics.roundRect(x + 5, y + 8, width, height, 26);
  graphics.fill({ color: 0x000000, alpha: 0.28 });
  graphics.roundRect(x, y, width, height, 26);
  graphics.fill({ color: 0x201715, alpha: 0.86 });
  graphics.stroke({ color: 0x100b0a, width: 5, alpha: 0.92 });
  graphics.roundRect(x + 9, y + 7, Math.max(0, width - 18), Math.max(0, height * 0.24), 16);
  graphics.fill({ color: 0xffffff, alpha: 0.045 });
}
