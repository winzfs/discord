import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

const importLine = 'import { getPixiBoardMetrics, getPixiCellCenter, getPixiCellIndexAtPoint } from "./pixiBoardGeometry";';

if (!source.includes(importLine)) {
  source = source.replace(
    'import { drawPixiBackgroundView } from "./pixiBackgroundView";\n',
    `import { drawPixiBackgroundView } from "./pixiBackgroundView";\n${importLine}\n`,
  );
}

writeFileSync(path, source);
console.log(`Updated ${path}`);
