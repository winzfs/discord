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

function gradeLabel(grade: string) {
  if (grade === "common") return "일반";
  if (grade === "rare") return "희귀";
  if (grade === "epic") return "영웅";
  if (grade === "legendary") return "전설";
  if (grade === "mythic") return "신화";
  return grade;
}

function roleLabel(role: string | undefined) {
  if (role === "damage") return "딜러";
  if (role === "tank") return "탱커";
  if (role === "support") return "지원";
  return "무관";
}

function attackTypeLabel(type: string | undefined) {
  if (type === "single") return "단일";
  if (type === "area") return "광역";
  if (type === "control") return "제어";
  if (type === "support") return "지원";
  return "기본";
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

  const definition = getHeroById(hero.heroId);
  const panelWidth = Math.min(layout.width - 24, 390);
  const panelHeight = 76;
  const panel = makePanel(panelWidth, panelHeight, 0x2d2925, gradeColor(hero.grade), 14);
  panel.alpha = 0.96;
  panel.x = layout.width / 2 - panelWidth / 2;
  panel.y = Math.max(layout.topHudY + 124, layout.bottomY - 146);
  refs.info.addChild(panel);

  const name = makeText(definition?.displayName ?? hero.heroId, 17, colors.white);
  name.x = panel.x + 14;
  name.y = panel.y + 10;
  refs.info.addChild(name);

  const meta = makeText(gradeLabel(hero.grade) + " · " + roleLabel(definition?.role) + " · " + attackTypeLabel(definition?.attackType), 12, gradeColor(hero.grade));
  meta.x = panel.x + 14;
  meta.y = panel.y + 34;
  refs.info.addChild(meta);

  const power = definition?.power ?? 0;
  const speed = definition?.attackSpeed ?? 0;
  const range = definition?.range ?? 0;
  const stats = makeText("전투력 " + power + "   공속 " + speed.toFixed(2) + "   사거리 " + range.toFixed(1), 12, colors.yellow);
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
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);`,
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.info, refs.effects, refs.menuLayer);`,
);

writeFileSync(path, s);
console.log(`Added unit info panel patch to ${path}`);
