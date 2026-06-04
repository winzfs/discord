import { Container } from "pixi.js";
import { colors } from "./gameTheme";
import { makePixiPanel, makePixiText } from "./pixiSharedView";
import { makePixiTouchBoundary, stopPixiPropagation } from "./pixiPointerGuards";

export type PixiUnitMenuCenter = {
  x: number;
  y: number;
  cell: number;
};

export type PixiUnitMenuViewOptions = {
  center: PixiUnitMenuCenter;
  rendererWidth: number;
  canMerge: boolean;
  onMerge: () => void;
  onSell: () => void;
};

function createUnitMenuButton(label: string, x: number, y: number, enabled: boolean, onTap: () => void) {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.eventMode = enabled ? "static" : "none";
  container.cursor = enabled ? "pointer" : "default";
  container.addChild(makePixiPanel(58, 34, enabled ? colors.panel : 0x655e59, enabled ? 0x2e241f : 0x3d3732, 10));

  const labelText = makePixiText(label, 14, enabled ? colors.white : 0xb7afa8);
  labelText.anchor.set(0.5);
  labelText.x = 29;
  labelText.y = 17;
  container.addChild(labelText);

  if (enabled) {
    container.on("pointerdown", stopPixiPropagation);
    container.on("pointerup", stopPixiPropagation);
    container.on("pointertap", (event: any) => {
      event.stopPropagation();
      onTap();
    });
  }

  return container;
}

export function createPixiUnitMenuView(options: PixiUnitMenuViewOptions) {
  const menu = new Container();
  menu.x = Math.max(8, Math.min(options.rendererWidth - 132, options.center.x - 62));
  menu.y = Math.max(8, options.center.y - options.center.cell * 0.95 - 38);
  makePixiTouchBoundary(menu, 124, 42);

  const background = makePixiPanel(124, 42, 0x2d2925, 0x1d1714, 12);
  background.alpha = 0.92;
  menu.addChild(background);
  menu.addChild(createUnitMenuButton("합성", 4, 4, options.canMerge, options.onMerge));
  menu.addChild(createUnitMenuButton("판매", 62, 4, true, options.onSell));

  return menu;
}
