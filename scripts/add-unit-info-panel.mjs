import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

const alreadyPatched =
  s.includes('import { mountPixiGameLayers } from "./pixiGameLayerOrder";') &&
  s.includes('import { shouldClearSelectionFromStagePointer } from "./pixiStagePointerHandlers";') &&
  s.includes('import { clearUnitInfoRuntime, drawUnitInfoRuntime, selectUnitInfoHeroInCell } from "./pixiUnitInfoRuntime";') &&
  s.includes("info: Container;") &&
  s.includes("selectedHeroInstanceId: string | null;") &&
  s.includes("mountPixiGameLayers(stage, refs);") &&
  s.includes("drawUnitInfoRuntime(refs, layout);") &&
  s.includes("selectUnitInfoHeroInCell(refs, cellIndex);") &&
  s.includes("shouldClearSelectionFromStagePointer(stage, event)");

if (alreadyPatched) {
  console.log(`Unit info panel patch already applied to ${path}`);
  process.exit(0);
}

const required = [
  "type GameRefs = {",
  "function showUnitMenu(refs: GameRefs, cellIndex: number)",
  "function drawBoard(refs: GameRefs, layout: GameLayout)",
  "stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);",
];
for (const text of required) {
  if (!s.includes(text)) throw new Error(`Missing expected text: ${text}`);
}

if (!s.includes('import { clearUnitInfoRuntime, drawUnitInfoRuntime, selectUnitInfoHeroInCell } from "./pixiUnitInfoRuntime";')) {
  s = s.replace(
    '} from "./pixiBoardView";',
    '} from "./pixiBoardView";\nimport { mountPixiGameLayers } from "./pixiGameLayerOrder";\nimport { shouldClearSelectionFromStagePointer } from "./pixiStagePointerHandlers";\nimport { clearUnitInfoRuntime, drawUnitInfoRuntime, selectUnitInfoHeroInCell } from "./pixiUnitInfoRuntime";',
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
  clearUnitInfoRuntime(refs);
  clearMenu(refs);
}

function drawUnitInfoPanel(refs: GameRefs, layout: GameLayout) {
  drawUnitInfoRuntime(refs, layout);
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

  selectUnitInfoHeroInCell(refs, cellIndex);
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
      if (shouldClearSelectionFromStagePointer(stage, event)) clearUnitSelection(refs);
    });
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));`,
);

s = s.replace(
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);`,
  `    mountPixiGameLayers(stage, refs);`,
);

s = s.replace(
  `      clearMenu(refs);
      invalidateHud(refs);`,
  `      clearUnitSelection(refs);
      invalidateHud(refs);`,
);

writeFileSync(path, s);
console.log(`Added unit info panel patch to ${path}`);
