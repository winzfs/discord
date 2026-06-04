import type { GameLayout } from "./gameLayout";

export type UnitInfoPanelLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getUnitInfoPanelLayout(layout: GameLayout): UnitInfoPanelLayout {
  const width = Math.min(layout.width - 24, 390);
  const height = 76;
  return {
    x: layout.width / 2 - width / 2,
    y: Math.max(layout.topHudY + 124, layout.bottomY - 146),
    width,
    height,
  };
}
