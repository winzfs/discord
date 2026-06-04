import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(before, after, label) {
  if (!source.includes(before)) {
    console.log(`[skip] ${label}`);
    return;
  }
  source = source.replace(before, after);
  console.log(`[ok] ${label}`);
}

replaceOnce(
  'import { createPixiUnitMenuView } from "./pixiUnitMenuView";\n',
  'import { createPixiUnitMenuView } from "./pixiUnitMenuView";\nimport { clearPixiUnitInfoView, drawPixiUnitInfoView } from "./pixiUnitInfoView";\n',
  "add unit info import",
);

replaceOnce(
  `  movementLocked: boolean;
  menu: Container | null;`,
  `  movementLocked: boolean;
  selectedCellIndex: number | null;
  menu: Container | null;`,
  "add selected cell ref",
);

replaceOnce(
  `function clearMenu(refs: GameRefs) {
  refs.menu?.destroy({ children: true });
  refs.menu = null;
}`,
  `function clearMenu(refs: GameRefs) {
  refs.menu?.destroy({ children: true });
  refs.menu = null;
}

function clearUnitSelection(refs: GameRefs) {
  refs.selectedCellIndex = null;
  clearPixiUnitInfoView(refs.info);
}

function drawSelectedUnitInfo(refs: GameRefs) {
  if (refs.selectedCellIndex === null) {
    clearPixiUnitInfoView(refs.info);
    return;
  }

  const cell = refs.state.board[refs.selectedCellIndex];
  const hero = cell?.units[cell.units.length - 1];
  if (!cell || !hero) {
    clearUnitSelection(refs);
    return;
  }

  drawPixiUnitInfoView(refs.info, {
    hero,
    stackCount: cell.units.length,
    cellIndex: refs.selectedCellIndex,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
  });
}

function clearMenuAndUnitInfo(refs: GameRefs) {
  clearMenu(refs);
  clearUnitSelection(refs);
}`,
  "add unit info helpers",
);

replaceOnce(
  `  clearMenu(refs);
  clearDrag(refs);`,
  `  clearMenu(refs);
  clearUnitSelection(refs);
  clearDrag(refs);`,
  "clear info on drag start",
);

replaceOnce(
  `  clearMenu(refs);

  const menu = createPixiUnitMenuView({`,
  `  clearMenu(refs);
  refs.selectedCellIndex = cellIndex;
  drawSelectedUnitInfo(refs);

  const menu = createPixiUnitMenuView({`,
  "show unit info with menu",
);

replaceOnce(
  `function mergeMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenu(refs);`,
  `function mergeMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenuAndUnitInfo(refs);`,
  "clear info on merge",
);

replaceOnce(
  `function sellMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenu(refs);`,
  `function sellMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenuAndUnitInfo(refs);`,
  "clear info on sell",
);

replaceOnce(
  `function summonAction(refs: GameRefs) {
  clearMenu(refs);`,
  `function summonAction(refs: GameRefs) {
  clearMenuAndUnitInfo(refs);`,
  "clear info on summon",
);

replaceOnce(
  `function gambleAction(refs: GameRefs) {
  clearMenu(refs);`,
  `function gambleAction(refs: GameRefs) {
  clearMenuAndUnitInfo(refs);`,
  "clear info on gamble",
);

replaceOnce(
  `function attackUpgradeAction(refs: GameRefs) {
  clearMenu(refs);`,
  `function attackUpgradeAction(refs: GameRefs) {
  clearMenuAndUnitInfo(refs);`,
  "clear info on upgrade",
);

replaceOnce(
  `function startAutoWave(refs: GameRefs) {
  if (isFinished(refs.state) || refs.wavePhase === "combat") return;
  clearMenu(refs);`,
  `function startAutoWave(refs: GameRefs) {
  if (isFinished(refs.state) || refs.wavePhase === "combat") return;
  clearMenuAndUnitInfo(refs);`,
  "clear info on wave start",
);

replaceOnce(
  `  drawBoard(refs, layout);
  drawControls(refs, layout);`,
  `  drawBoard(refs, layout);
  drawSelectedUnitInfo(refs);
  drawControls(refs, layout);`,
  "render selected unit info",
);

replaceOnce(
  `    movementLocked: false,
    menu: null,`,
  `    movementLocked: false,
    selectedCellIndex: null,
    menu: null,`,
  "init selected cell ref",
);

replaceOnce(
  `    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));`,
  `    stage.on("pointerdown", (event: any) => {
      const cellIndex = getCellIndexAtPoint(refs, event.global.x, event.global.y);
      const cell = cellIndex === null ? null : refs.state.board[cellIndex];
      if (!cell || cell.units.length === 0) clearMenuAndUnitInfo(refs);
    });
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));`,
  "dismiss menu on empty/outside tap",
);

replaceOnce(
  `      clearMenu(refs);
      invalidateHud(refs);`,
  `      clearMenuAndUnitInfo(refs);
      invalidateHud(refs);`,
  "clear info on resize",
);

replaceOnce(
  `      clearMenu(refs);
      clearDrag(refs);`,
  `      clearMenuAndUnitInfo(refs);
      clearDrag(refs);`,
  "clear info on cleanup",
);

writeFileSync(path, source);
console.log(`Updated ${path}`);
