import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

function replaceFunction(name, body) {
  const start = source.indexOf(`function ${name}`);
  if (start < 0) {
    console.log(`[skip] ${name}`);
    return;
  }

  const braceStart = source.indexOf("{", start);
  let depth = 0;
  let end = braceStart;
  for (; end < source.length; end += 1) {
    const char = source[end];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end += 1;
        break;
      }
    }
  }

  const header = source.slice(start, braceStart + 1);
  source = `${source.slice(0, braceStart + 1)}\n${body}\n${source.slice(end)}`;
  console.log(`[ok] ${name}: ${header.trim()}`);
}

replaceFunction("getBoardMetrics", "  return getPixiBoardMetrics(layout, refs.state.boardSize);");
replaceFunction("getCellCenter", "  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);\n  return getPixiCellCenter(getBoardMetrics(refs, layout), cellIndex);");
replaceFunction("getCellIndexAtPoint", "  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);\n  return getPixiCellIndexAtPoint(getBoardMetrics(refs, layout), x, y);");

writeFileSync(path, source);
console.log(`Updated ${path}`);
