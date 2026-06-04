import { Container, Graphics, Text } from "pixi.js";
import { colors } from "./gameTheme";

export function makePixiText(value: string, size = 18, fill: number = colors.white) {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: "bold",
      stroke: { color: colors.black, width: size > 18 ? 4 : 2 },
    },
  });
}

export function makePixiPanel(width: number, height: number, fill: number, stroke = colors.panelDark, radius = 16) {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, radius);
  panel.fill({ color: fill, alpha: 1 });
  panel.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return panel;
}

export function clearPixiContainer(container: Container) {
  container.removeChildren();
}

export function destroyPixiChild(child: { destroyed?: boolean; destroy: (options?: { children?: boolean }) => void }) {
  if (child.destroyed) return;
  child.destroy({ children: true });
}
