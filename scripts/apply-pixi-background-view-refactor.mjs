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
  'import { getPixiPathPoint } from "./pixiPathRuntime";\n',
  'import { getPixiPathPoint } from "./pixiPathRuntime";\nimport { drawPixiBackgroundView } from "./pixiBackgroundView";\n',
  "add background view import",
);

replaceOnce(
  `function drawBackground(refs: GameRefs, layout: GameLayout) {
  clear(refs.world);
  const background = new Graphics();
  background.rect(0, 0, layout.width, layout.height);
  background.fill(colors.sky);
  refs.world.addChild(background);

  const road = new Graphics();
  const first = getPathPoint(layout, 0);
  road.moveTo(first.x, first.y);
  for (let index = 1; index <= 96; index += 1) {
    const point = getPathPoint(layout, index / 96);
    road.lineTo(point.x, point.y);
  }
  road.stroke({ color: colors.dirtDark, width: 42, alpha: 1 });
  road.stroke({ color: colors.dirt, width: 34, alpha: 1 });
  refs.world.addChild(road);

  const boardShadow = makePanel(layout.boardWidth + 14, layout.boardHeight + 14, colors.wood, 0x4f3424, 18);
  boardShadow.x = layout.boardX - 7;
  boardShadow.y = layout.boardY - 7;
  refs.world.addChild(boardShadow);

  const field = makePanel(layout.boardWidth, layout.boardHeight, colors.field, 0x4f7d2a, 16);
  field.x = layout.boardX;
  field.y = layout.boardY;
  refs.world.addChild(field);
}`,
  `function drawBackground(refs: GameRefs, layout: GameLayout) {
  drawPixiBackgroundView(refs.world, layout, getPathPoint);
}`,
  "delegate background view",
);

writeFileSync(path, source);
console.log(`Updated ${path}`);
