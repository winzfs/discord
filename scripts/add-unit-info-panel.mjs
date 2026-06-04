import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

const required = [
  "type GameRefs = {",
  "function showUnitMenu(refs: GameRefs, cellIndex: number)",
  "function drawBoard(refs: GameRefs, layout: GameLayout)",
  "stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);",
];
for (const text of required) {
  if (!s.includes(text)) throw new Error(`Missing expected text: ${text}`);
}

s = s.replace('import { colors } from "./gameTheme";', 'import { colors, gradeColor } from "./gameTheme";');
if (!s.includes('import { getUnitInfoText } from "./pixiUnitInfoText";')) {
  s = s.replace(
    '} from "./pixiBoardView";',
    '} from "./pixiBoardView";\nimport { getUnitInfoText } from "./pixiUnitInfoText";\nimport { getUnitInfoPanelLayout } from "./pixiUnitInfoPanelLayout";',
  );
}

s = s.replace(
  `  menuLayer: Container;
  hudView: PixiHudView | null;`,
  `  menuLayer: Container;
  info: Container;
  hudView: PixiHudView | null;`,
);

s = s.replace(
  `  lastWaveSummary: WaveSummary | null;
};`,
  `  lastWaveSummary: WaveSummary | null;
  selectedHeroInstanceId: string | null;
};`,
);

s = s.replace(
  `function clearDrag(refs: GameRefs) {
  refs.dragging?.ghost.destroy({ children: true });
  refs.dragging = null;
}
`,
  `function clearDrag(refs: GameRefs) {
  refs.dragging?.ghost.destroy({ children: true });
  refs.dragging = null;
}

function clearUnitSelection(refs: GameRefs) {
  refs.selectedHeroInstanceId = null;
  refs.info.removeChildren();
  clearMenu(refs);
}

function getSelectedHero(refs: GameRefs): BoardHero | null {
  if (!refs.selectedHeroInstanceId) return null;
  return getAllBoardHeroes(refs.state.board).find((hero) => hero.instanceId === refs.selectedHeroInstanceId) ?? null;
}

function selectTopHeroInCell(refs: GameRefs, cellIndex: number) {
  const cell = refs.state.board[cellIndex];
  const hero = cell?.units[cell.units.length - 1] ?? null;
  refs.selectedHeroInstanceId = hero?.instanceId ?? null;
}

function clearSelectedHeroIfMissing(refs: GameRefs) {
  if (!refs.selectedHeroInstanceId) return;
  if (!getSelectedHero(refs)) refs.selectedHeroInstanceId = null;
}

function drawUnitInfoPanel(refs: GameRefs, layout: GameLayout) {
  clearSelectedHeroIfMissing(refs);
  refs.info.removeChildren();

  const hero = getSelectedHero(refs);
  if (!hero) return;

  const info = getUnitInfoText(hero);
  const panelLayout = getUnitInfoPanelLayout(layout);
  const panel = makePanel(panelLayout.width, panelLayout.height, 0x2d2925, gradeColor(hero.grade), 14);
  panel.alpha = 0.96;
  panel.x = panelLayout.x;
  panel.y = panelLayout.y;
  refs.info.addChild(panel);

  const name = makeText(info.name, 17, colors.white);
  name.x = panel.x + 14;
  name.y = panel.y + 10;
  refs.info.addChild(name);

  const meta = makeText(info.meta, 12, gradeColor(hero.grade));
  meta.x = panel.x + 14;
  meta.y = panel.y + 34;
  refs.info.addChild(meta);

  const stats = makeText(info.stats, 12, colors.yellow);
  stats.x = panel.x + 14;
  stats.y = panel.y + 53;
  refs.info.addChild(stats);
}
`,
);

s = s.replace(
  `function showUnitMenu(refs: GameRefs, cellIndex: number) {
  if (refs.movementLocked) return;
  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;

  clearMenu(refs);
`,
  `function showUnitMenu(refs: GameRefs, cellIndex: number) {
  if (refs.movementLocked) return;
  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;

  selectTopHeroInCell(refs, cellIndex);
  drawUnitInfoPanel(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  clearMenu(refs);
`,
);

s = s.replace(
  `function drawBoard(refs: GameRefs, layout: GameLayout) {
  const metrics = getBoardMetrics(refs, layout);
  drawBoardCells(refs.board, refs.state.board, metrics, (cellIndex) => canMergeStackCell(refs.state, cellIndex), {
    canDrag: !refs.movementLocked,
    onCellPointerDown: (cellIndex, globalX, globalY, cellSize) => beginCellDrag(refs, cellIndex, globalX, globalY, cellSize),
  });
}
`,
  `function drawBoard(refs: GameRefs, layout: GameLayout) {
  const metrics = getBoardMetrics(refs, layout);
  drawBoardCells(refs.board, refs.state.board, metrics, (cellIndex) => canMergeStackCell(refs.state, cellIndex), {
    canDrag: !refs.movementLocked,
    onCellPointerDown: (cellIndex, globalX, globalY, cellSize) => beginCellDrag(refs, cellIndex, globalX, globalY, cellSize),
  });
  drawUnitInfoPanel(refs, layout);
}
`,
);

s = s.replace(
  `    menuLayer: new Container(),
    hudView: null,`,
  `    menuLayer: new Container(),
    info: new Container(),
    hudView: null,`,
);

s = s.replace(
  `    lastWaveSummary: null,
  };`,
  `    lastWaveSummary: null,
    selectedHeroInstanceId: null,
  };`,
);

s = s.replace(
  `    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));`,
  `    stage.on("pointerdown", (event: any) => {
      if (event.target === stage) clearUnitSelection(refs);
    });
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));`,
);

s = s.replace(
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);`,
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.info, refs.effects, refs.menuLayer);`,
);

s = s.replace(
  `      clearMenu(refs);
      invalidateHud(refs);`,
  `      clearUnitSelection(refs);
      invalidateHud(refs);`,
);

writeFileSync(path, s);
console.log(`Added unit info panel patch to ${path}`);
