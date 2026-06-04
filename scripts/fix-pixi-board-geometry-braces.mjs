import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

source = source.replace(
  `function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  return getPixiBoardMetrics(layout, refs.state.boardSize);


function getCellCenter`,
  `function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  return getPixiBoardMetrics(layout, refs.state.boardSize);
}

function getCellCenter`,
);

source = source.replace(
  `function getCellCenter(refs: GameRefs, cellIndex: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  return getPixiCellCenter(getBoardMetrics(refs, layout), cellIndex);


function getCellIndexAtPoint`,
  `function getCellCenter(refs: GameRefs, cellIndex: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  return getPixiCellCenter(getBoardMetrics(refs, layout), cellIndex);
}

function getCellIndexAtPoint`,
);

source = source.replace(
  `function getCellIndexAtPoint(refs: GameRefs, x: number, y: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  return getPixiCellIndexAtPoint(getBoardMetrics(refs, layout), x, y);


function roleAccent`,
  `function getCellIndexAtPoint(refs: GameRefs, x: number, y: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  return getPixiCellIndexAtPoint(getBoardMetrics(refs, layout), x, y);
}

function roleAccent`,
);

writeFileSync(path, source);
console.log(`Fixed board geometry braces in ${path}`);
