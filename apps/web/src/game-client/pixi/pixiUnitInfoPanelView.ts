import type { Container } from "pixi.js";
import type { BoardHero } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import { colors, gradeColor } from "./gameTheme";
import { makePixiPanel, makePixiText } from "./pixiSharedView";
import { getUnitInfoPanelLayout } from "./pixiUnitInfoPanelLayout";
import { getUnitInfoText } from "./pixiUnitInfoText";

export function drawUnitInfoPanelView(container: Container, hero: BoardHero | null, layout: GameLayout) {
  container.removeChildren();
  if (!hero) return;

  const info = getUnitInfoText(hero);
  const panelLayout = getUnitInfoPanelLayout(layout);
  const panel = makePixiPanel(panelLayout.width, panelLayout.height, 0x2d2925, gradeColor(hero.grade), 14);
  panel.alpha = 0.96;
  panel.x = panelLayout.x;
  panel.y = panelLayout.y;
  container.addChild(panel);

  const name = makePixiText(info.name, 17, colors.white);
  name.x = panel.x + 14;
  name.y = panel.y + 10;
  container.addChild(name);

  const meta = makePixiText(info.meta, 12, gradeColor(hero.grade));
  meta.x = panel.x + 14;
  meta.y = panel.y + 34;
  container.addChild(meta);

  const stats = makePixiText(info.stats, 12, colors.yellow);
  stats.x = panel.x + 14;
  stats.y = panel.y + 53;
  container.addChild(stats);
}
