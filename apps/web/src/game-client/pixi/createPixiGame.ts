import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";
import {
  calculateBoardPower,
  canMergeStackCell,
  completeCurrentWave,
  craftMythicHero,
  createInitialGameState,
  createSeededRandom,
  gambleSummon,
  getAllBoardHeroes,
  getBoardCapacity,
  getBoardUnitCount,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  getWaveByNumber,
  isBoardFull,
  mergeStackedCell,
  moveOneHeroToCell,
  sellTopUnitInCell,
  startWave,
  summonHero,
  upgradeAttack,
} from "@discord-random-defense/game";
import type { BoardHero, GameState, WaveProgressResult } from "@discord-random-defense/game";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors, gradeColor } from "./gameTheme";

export type PixiGameHandle = {
  cleanup: () => void;
};

type Animation = {
  age: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};

type DragState = {
  sourceIndex: number;
  startX: number;
  startY: number;
  ghost: Container;
  isMoving: boolean;
};

type BoardMetrics = {
  cols: number;
  rows: number;
  cell: number;
  gap: number;
  startX: number;
  startY: number;
};

type WavePhase = "countdown" | "combat" | "result";

type ActiveEnemy = {
  id: number;
  x: number;
  y: number;
  alive: boolean;
  boss: boolean;
};

type GameRefs = {
  app: Application;
  stage: Container;
  world: Container;
  board: Container;
  hud: Container;
  controls: Container;
  effects: Container;
  menuLayer: Container;
  state: GameState;
  random: ReturnType<typeof createSeededRandom>;
  animations: Animation[];
  lastSummonedIndex: number | null;
  dragging: DragState | null;
  movementLocked: boolean;
  menu: Container | null;
  wavePhase: WavePhase;
  nextWaveTimer: number;
  combatTimer: number;
  resultTimer: number;
  attackTimer: number;
  activeEnemies: ActiveEnemy[];
  nextEnemyId: number;
};

const WAVE_COUNTDOWN_SECONDS = 8;
const WAVE_COMBAT_SECONDS = 8;
const WAVE_RESULT_SECONDS = 1.4;

function text(value: string, size = 18, fill: number = colors.white, weight: "normal" | "bold" = "bold") {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: weight,
      stroke: { color: colors.black, width: size > 18 ? 4 : 2 },
    },
  });
}

function panel(w: number, h: number, fill: number, stroke: number = colors.panelDark, radius = 16) {
  const g = new Graphics();
  g.roundRect(0, 0, w, h, radius);
  g.fill({ color: fill, alpha: 1 });
  g.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return g;
}

function clear(c: Container) {
  c.removeChildren();
}

function isFinished(state: GameState) {
  return state.status === "failed" || state.status === "cleared";
}

function isBossWave(state: GameState) {
  return state.currentWave % 5 === 0;
}

function addAnim(refs: GameRefs, anim: Omit<Animation, "age">) {
  refs.animations.push({ ...anim, age: 0 });
}

function clearMenu(refs: GameRefs) {
  if (refs.menu) refs.menu.destroy({ children: true });
  refs.menu = null;
}

function clearDrag(refs: GameRefs) {
  if (refs.dragging?.ghost) refs.dragging.ghost.destroy({ children: true });
  refs.dragging = null;
}

function getCellIndexFromHero(state: GameState, hero: BoardHero | null): number | null {
  if (!hero) return null;
  return hero.position.row * state.boardSize.columns + hero.position.column;
}

function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const cell = Math.min((layout.boardWidth - 34 - gap * (cols - 1)) / cols, (layout.boardHeight - 32 - gap * (rows - 1)) / rows);
  return {
    cols,
    rows,
    cell,
    gap,
    startX: layout.boardX + (layout.boardWidth - cell * cols - gap * (cols - 1)) / 2,
    startY: layout.boardY + 16,
  };
}

function getCellCenter(refs: GameRefs, cellIndex: number): { x: number; y: number; cell: number } {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);
  const row = Math.floor(cellIndex / metrics.cols);
  const col = cellIndex % metrics.cols;
  return {
    x: metrics.startX + col * (metrics.cell + metrics.gap) + metrics.cell / 2,
    y: metrics.startY + row * (metrics.cell + metrics.gap) + metrics.cell * 0.48,
    cell: metrics.cell,
  };
}

function getCellIndexAtPoint(refs: GameRefs, x: number, y: number): number | null {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const metrics = getBoardMetrics(refs, layout);
  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const cellX = metrics.startX + col * (metrics.cell + metrics.gap);
      const cellY = metrics.startY + row * (metrics.cell + metrics.gap);
      if (x >= cellX && x <= cellX + metrics.cell && y >= cellY && y <= cellY + metrics.cell) {
        return row * metrics.cols + col;
      }
    }
  }
  return null;
}

function drawUnitShape(target: Container, grade: string, cell: number, scale = 1) {
  const shadow = new Graphics();
  shadow.ellipse(0, cell * 0.24 * scale, cell * 0.2 * scale, cell * 0.06 * scale);
  shadow.fill({ color: 0x244f1e, alpha: 0.28 });
  target.addChild(shadow);

  const body = new Graphics();
  body.circle(0, 0, cell * 0.22 * scale);
  body.fill({ color: gradeColor(grade), alpha: 1 });
  body.stroke({ color: colors.black, width: Math.max(2, 3 * scale), alpha: 0.56 });
  target.addChild(body);

  const head = new Graphics();
  head.circle(0, -cell * 0.18 * scale, cell * 0.15 * scale);
  head.fill({ color: 0xffd0a6, alpha: 1 });
  head.stroke({ color: colors.black, width: Math.max(1.5, 2 * scale), alpha: 0.56 });
  target.addChild(head);

  if (grade === "mythic") {
    const halo = new Graphics();
    halo.circle(0, -cell * 0.04 * scale, cell * 0.34 * scale);
    halo.stroke({ color: colors.yellow, width: Math.max(2, 4 * scale), alpha: 0.8 });
    target.addChild(halo);
  }
}

function createUnitGhost(grade: string, cell: number, alpha = 0.92): Container {
  const ghost = new Container();
  ghost.alpha = alpha;
  drawUnitShape(ghost, grade, cell, 0.94);
  return ghost;
}

function beginCellDrag(refs: GameRefs, sourceIndex: number, globalX: number, globalY: number, cell: number) {
  if (isFinished(refs.state) || refs.movementLocked) return;
  const sourceCell = refs.state.board[sourceIndex];
  const movingHero = sourceCell?.units[sourceCell.units.length - 1];
  if (!movingHero) return;

  clearMenu(refs);
  clearDrag(refs);
  const ghost = createUnitGhost(movingHero.grade, cell, 0);
  ghost.x = globalX;
  ghost.y = globalY;
  refs.effects.addChild(ghost);
  refs.dragging = { sourceIndex, startX: globalX, startY: globalY, ghost, isMoving: false };
}

function moveDragGhost(refs: GameRefs, globalX: number, globalY: number) {
  if (!refs.dragging) return;
  const dx = globalX - refs.dragging.startX;
  const dy = globalY - refs.dragging.startY;
  if (!refs.dragging.isMoving && Math.hypot(dx, dy) > 8) {
    refs.dragging.isMoving = true;
    refs.dragging.ghost.alpha = 0.84;
    refs.dragging.ghost.scale.set(1.08);
  }
  if (refs.dragging.isMoving) {
    refs.dragging.ghost.x = globalX;
    refs.dragging.ghost.y = globalY;
  }
}

function animateWalk(refs: GameRefs, hero: BoardHero, fromIndex: number, toIndex: number, done?: () => void) {
  const from = getCellCenter(refs, fromIndex);
  const to = getCellCenter(refs, toIndex);
  const ghost = createUnitGhost(hero.grade, from.cell, 0.95);
  ghost.x = from.x;
  ghost.y = from.y;
  refs.effects.addChild(ghost);

  addAnim(refs, {
    duration: 420,
    update: (p) => {
      const eased = 1 - Math.pow(1 - p, 3);
      const bob = Math.sin(p * Math.PI * 4) * from.cell * 0.04;
      ghost.x = from.x + (to.x - from.x) * eased;
      ghost.y = from.y + (to.y - from.y) * eased + bob;
      ghost.rotation = Math.sin(p * Math.PI * 6) * 0.08;
    },
    done: () => {
      ghost.destroy({ children: true });
      done?.();
    },
  });
}

function animateMoveResult(refs: GameRefs, sourceIndex: number, targetIndex: number, previousState: GameState, nextState: GameState, action: "move" | "stack" | "swap") {
  refs.movementLocked = true;
  const sourceCell = previousState.board[sourceIndex];
  const targetCell = previousState.board[targetIndex];
  const movingHero = sourceCell?.units[sourceCell.units.length - 1];
  if (!movingHero) {
    refs.state = nextState;
    refs.movementLocked = false;
    render(refs);
    return;
  }

  const finish = () => {
    refs.state = nextState;
    refs.lastSummonedIndex = targetIndex;
    refs.movementLocked = false;
    render(refs);
    const label = action === "swap" ? "자리 교환" : action === "stack" ? "중첩" : "이동";
    floatText(refs, label, refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, action === "swap" ? colors.orange : colors.green);
    addAnim(refs, {
      duration: 320,
      update: (p) => {
        if (p > 0.75) refs.lastSummonedIndex = null;
        drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
      },
    });
  };

  if (action === "swap" && targetCell?.units[0]) {
    let completed = 0;
    const done = () => {
      completed += 1;
      if (completed >= 2) finish();
    };
    animateWalk(refs, movingHero, sourceIndex, targetIndex, done);
    animateWalk(refs, targetCell.units[0], targetIndex, sourceIndex, done);
    return;
  }

  animateWalk(refs, movingHero, sourceIndex, targetIndex, finish);
}

function finishCellDrag(refs: GameRefs, globalX: number, globalY: number) {
  if (!refs.dragging) return;
  const sourceIndex = refs.dragging.sourceIndex;
  const wasMoving = refs.dragging.isMoving;
  const targetIndex = getCellIndexAtPoint(refs, globalX, globalY);
  clearDrag(refs);

  if (!wasMoving || targetIndex === sourceIndex) {
    showUnitMenu(refs, sourceIndex);
    return;
  }

  if (targetIndex === null) {
    floatText(refs, "이동 취소", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.white);
    return;
  }

  const previousState = refs.state;
  const result = moveOneHeroToCell(refs.state, sourceIndex, targetIndex);
  if (!result.movedHero || !result.action) {
    if (result.reason === "target_full") {
      floatText(refs, "칸이 가득 찼어", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.red);
    }
    return;
  }

  animateMoveResult(refs, sourceIndex, targetIndex, previousState, result.state, result.action);
}

function menuButton(label: string, x: number, y: number, enabled: boolean, onTap: () => void) {
  const c = new Container();
  c.x = x;
  c.y = y;
  c.eventMode = enabled ? "static" : "none";
  c.cursor = enabled ? "pointer" : "default";
  const bg = panel(58, 34, enabled ? colors.panel : 0x655e59, enabled ? 0x2e241f : 0x3d3732, 10);
  bg.alpha = enabled ? 0.98 : 0.72;
  c.addChild(bg);
  const t = text(label, 14, enabled ? colors.white : 0xb7afa8);
  t.anchor.set(0.5);
  t.x = 29;
  t.y = 17;
  c.addChild(t);
  if (enabled) c.on("pointertap", (event: any) => { event.stopPropagation(); onTap(); });
  return c;
}

function showUnitMenu(refs: GameRefs, cellIndex: number) {
  if (refs.movementLocked) return;
  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;
  clearMenu(refs);

  const center = getCellCenter(refs, cellIndex);
  const canMerge = canMergeStackCell(refs.state, cellIndex);
  const menu = new Container();
  menu.x = Math.max(8, Math.min(refs.app.renderer.width - 132, center.x - 62));
  menu.y = Math.max(8, center.y - center.cell * 0.95 - 38);

  const bg = panel(124, 42, 0x2d2925, 0x1d1714, 12);
  bg.alpha = 0.92;
  menu.addChild(bg);
  menu.addChild(menuButton("합성", 4, 4, canMerge, () => mergeMenuAction(refs, cellIndex)));
  menu.addChild(menuButton("판매", 62, 4, true, () => sellMenuAction(refs, cellIndex)));

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

function mergeMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenu(refs);
  const result = mergeStackedCell(refs.state, cellIndex, refs.random);
  if (!result.mergedHero) {
    const message = result.reason === "not_full_stack" ? "3마리 필요" : result.reason === "max_grade" ? "최고 등급" : "합성 불가";
    floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.red);
    return;
  }
  refs.state = result.state;
  refs.lastSummonedIndex = cellIndex;
  render(refs);
  floatText(refs, "합성!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.yellow);
  addAnim(refs, {
    duration: 420,
    update: (p) => {
      if (p > 0.75) refs.lastSummonedIndex = null;
      drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    },
  });
}

function sellMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenu(refs);
  const result = sellTopUnitInCell(refs.state, cellIndex);
  if (!result.soldHero) {
    floatText(refs, "판매 불가", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.red);
    return;
  }
  refs.state = result.state;
  render(refs);
  floatText(refs, `판매 +${result.reward}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.green);
}

function getPathPoint(layout: GameLayout, progress: number) {
  const left = 26;
  const right = layout.width - 26;
  const top = Math.max(layout.mapTop + 78, layout.boardY - 48);
  const bottom = Math.min(layout.boardY + layout.boardHeight + 48, layout.height - 184);
  const phase = Math.max(0, Math.min(1, progress)) * 3;
  if (phase < 1) return { x: right - (right - left) * phase, y: top };
  if (phase < 2) return { x: left, y: top + (bottom - top) * (phase - 1) };
  return { x: left + (right - left) * (phase - 2), y: bottom };
}

function drawBackground(refs: GameRefs, layout: GameLayout) {
  clear(refs.world);
  const bg = new Graphics();
  bg.rect(0, 0, layout.width, layout.height);
  bg.fill(colors.sky);
  refs.world.addChild(bg);

  for (let i = 0; i < 42; i += 1) {
    const x = (i * 47) % layout.width;
    const y = 34 + ((i * 29) % Math.max(80, layout.height - 170));
    const tree = new Graphics();
    tree.circle(x, y, 22 + (i % 3) * 4);
    tree.fill({ color: i % 2 ? colors.forest : colors.forestDark, alpha: 0.9 });
    tree.circle(x + 16, y + 9, 18);
    tree.fill({ color: colors.forest, alpha: 0.9 });
    refs.world.addChild(tree);
  }

  const road = new Graphics();
  const first = getPathPoint(layout, 0);
  road.moveTo(first.x, first.y);
  for (let i = 1; i <= 80; i += 1) {
    const point = getPathPoint(layout, i / 80);
    road.lineTo(point.x, point.y);
  }
  road.stroke({ color: colors.dirtDark, width: 42, alpha: 1 });
  road.stroke({ color: colors.dirt, width: 34, alpha: 1 });
  refs.world.addChild(road);

  const boardShadow = panel(layout.boardWidth + 14, layout.boardHeight + 14, colors.wood, 0x4f3424, 18);
  boardShadow.x = layout.boardX - 7;
  boardShadow.y = layout.boardY - 7;
  refs.world.addChild(boardShadow);

  const field = panel(layout.boardWidth, layout.boardHeight, colors.field, 0x4f7d2a, 16);
  field.x = layout.boardX;
  field.y = layout.boardY;
  refs.world.addChild(field);

  const fieldGlow = new Graphics();
  fieldGlow.roundRect(layout.boardX + 8, layout.boardY + 8, layout.boardWidth - 16, layout.boardHeight - 16, 12);
  fieldGlow.fill({ color: colors.fieldLight, alpha: 0.18 });
  refs.world.addChild(fieldGlow);
}

function drawTopHud(refs: GameRefs, layout: GameLayout) {
  clear(refs.hud);
  const boss = isBossWave(refs.state);
  const waveBox = panel(150, 58, boss ? 0x5a2327 : colors.panel, boss ? colors.red : 0x3b2d26, 12);
  waveBox.x = layout.width / 2 - 75;
  waveBox.y = layout.topHudY;
  refs.hud.addChild(waveBox);
  const wave = text(`WAVE ${refs.state.currentWave}`, 18, colors.white);
  wave.anchor.set(0.5, 0);
  wave.x = layout.width / 2;
  wave.y = layout.topHudY + 7;
  refs.hud.addChild(wave);
  const timerLabel = refs.wavePhase === "combat" ? `${Math.ceil(refs.combatTimer)}s` : refs.wavePhase === "result" ? "RESULT" : `${Math.ceil(refs.nextWaveTimer)}s`;
  const timer = text(boss ? `BOSS ${timerLabel}` : `NEXT ${timerLabel}`, 20, boss ? colors.red : colors.white);
  timer.anchor.set(0.5, 0);
  timer.x = layout.width / 2;
  timer.y = layout.topHudY + 30;
  refs.hud.addChild(timer);

  const hpBg = panel(layout.width - 92, 24, 0x4d2228, 0x2f1519, 12);
  hpBg.x = 46;
  hpBg.y = layout.topHudY + 66;
  refs.hud.addChild(hpBg);
  const hpRatio = Math.max(0, Math.min(1, refs.state.lives / 100));
  const hp = new Graphics();
  hp.roundRect(50, layout.topHudY + 70, (layout.width - 100) * hpRatio, 16, 8);
  hp.fill({ color: colors.red, alpha: 1 });
  refs.hud.addChild(hp);
  const hpText = text(`${refs.state.lives} / 100`, 16, colors.white);
  hpText.anchor.set(0.5, 0);
  hpText.x = layout.width / 2;
  hpText.y = layout.topHudY + 67;
  refs.hud.addChild(hpText);

  const boardPower = calculateBoardPower(refs.state);
  const unitCount = getBoardUnitCount(refs.state.board);
  const unitCapacity = getBoardCapacity(refs.state.board);
  const power = text(`전투력 ${boardPower.totalPower}`, 15, colors.white);
  power.x = 22;
  power.y = layout.topHudY + 98;
  refs.hud.addChild(power);
  const units = text(`${unitCount} / ${unitCapacity}`, 15, colors.white);
  units.x = layout.width - 96;
  units.y = layout.topHudY + 98;
  refs.hud.addChild(units);
  const coin = text(`코인 ${refs.state.resources}`, 18, colors.yellow);
  coin.x = 24;
  coin.y = layout.bottomY - 34;
  refs.hud.addChild(coin);
  const luck = text(`행운석 ${refs.state.luckStones}`, 16, colors.blue);
  luck.x = 24;
  luck.y = layout.bottomY - 58;
  refs.hud.addChild(luck);
  const score = text(`${refs.state.score}`, 18, colors.white);
  score.x = layout.width - 132;
  score.y = layout.bottomY - 30;
  refs.hud.addChild(score);
}

function getStackOffset(stackCount: number, index: number, cell: number) {
  if (stackCount <= 1) return { x: 0, y: 0, scale: 1 };
  if (stackCount === 2) return index === 0 ? { x: -cell * 0.16, y: cell * 0.02, scale: 0.82 } : { x: cell * 0.16, y: cell * 0.02, scale: 0.82 };
  if (index === 0) return { x: 0, y: -cell * 0.15, scale: 0.74 };
  if (index === 1) return { x: -cell * 0.17, y: cell * 0.13, scale: 0.74 };
  return { x: cell * 0.17, y: cell * 0.13, scale: 0.74 };
}

function drawUnitMarker(refs: GameRefs, x: number, y: number, cell: number, grade: string, stackCount: number, stackIndex: number) {
  const offset = getStackOffset(stackCount, stackIndex, cell);
  const marker = new Container();
  marker.x = x + cell / 2 + offset.x;
  marker.y = y + cell * 0.48 + offset.y;
  drawUnitShape(marker, grade, cell, offset.scale);
  refs.board.addChild(marker);
}

function drawBoard(refs: GameRefs, layout: GameLayout) {
  clear(refs.board);
  const metrics = getBoardMetrics(refs, layout);
  refs.state.board.forEach((boardCell, index) => {
    const row = Math.floor(index / metrics.cols);
    const col = index % metrics.cols;
    const x = metrics.startX + col * (metrics.cell + metrics.gap);
    const y = metrics.startY + row * (metrics.cell + metrics.gap);
    const units = boardCell.units;
    const firstUnit = units[0];
    const isNew = refs.lastSummonedIndex === index;
    const pulse = isNew ? 1.08 : 1;
    const inset = (metrics.cell * (pulse - 1)) / 2;
    const isFullStack = units.length >= 3;
    const canMerge = canMergeStackCell(refs.state, index);

    const g = new Graphics();
    g.roundRect(x - inset, y - inset, metrics.cell * pulse, metrics.cell * pulse, 12);
    g.fill({ color: units.length > 0 ? 0x6ac144 : 0x539832, alpha: units.length > 0 ? 0.96 : 0.45 });
    g.stroke({ color: canMerge ? colors.yellow : firstUnit ? gradeColor(firstUnit.grade) : 0x3e7629, width: isFullStack ? 4 : units.length > 0 ? 3 : 2, alpha: 0.9 });
    refs.board.addChild(g);
    if (canMerge) {
      const glow = new Graphics();
      glow.roundRect(x + 3, y + 3, metrics.cell - 6, metrics.cell - 6, 10);
      glow.stroke({ color: colors.yellow, width: 2, alpha: 0.45 });
      refs.board.addChild(glow);
    }
    units.forEach((unit, unitIndex) => drawUnitMarker(refs, x, y, metrics.cell, unit.grade, units.length, unitIndex));

    const hit = new Graphics();
    hit.roundRect(x, y, metrics.cell, metrics.cell, 12);
    hit.fill({ color: 0xffffff, alpha: 0.001 });
    hit.eventMode = units.length > 0 && !refs.movementLocked ? "static" : "none";
    hit.cursor = units.length > 0 && !refs.movementLocked ? "grab" : "default";
    hit.on("pointerdown", (event: any) => {
      event.stopPropagation();
      beginCellDrag(refs, index, event.global.x, event.global.y, metrics.cell);
    });
    refs.board.addChild(hit);
  });
}

function button(label: string, sub: string, w: number, h: number, color: number, onTap: () => void, options: { disabled?: boolean; subFill?: number } = {}) {
  const disabled = Boolean(options.disabled);
  const c = new Container();
  c.eventMode = disabled ? "none" : "static";
  c.cursor = disabled ? "default" : "pointer";
  const bg = panel(w, h, disabled ? 0x6f6259 : color, disabled ? 0x3d332e : 0x51351e, 14);
  bg.alpha = disabled ? 0.72 : 1;
  c.addChild(bg);
  const s = text(sub, 12, options.subFill ?? (disabled ? 0x2d2825 : colors.black));
  s.x = 16;
  s.y = 9;
  s.alpha = disabled ? 0.75 : 1;
  c.addChild(s);
  const t = text(label, 22, disabled ? 0xd0c6bc : colors.white);
  t.anchor.set(0.5, 0);
  t.x = w / 2;
  t.y = 31;
  t.alpha = disabled ? 0.78 : 1;
  c.addChild(t);
  if (!disabled) c.on("pointertap", () => { c.scale.set(0.96); window.setTimeout(() => c.scale.set(1), 80); onTap(); });
  return c;
}

function getSummonButtonState(state: GameState) {
  const cost = getSummonCost(state.summonCount);
  const boardFull = isBoardFull(state.board);
  const disabled = isFinished(state) || boardFull || state.resources < cost;
  if (state.status === "failed") return { cost, disabled, sub: "게임 오버" };
  if (state.status === "cleared") return { cost, disabled, sub: "클리어" };
  if (boardFull) return { cost, disabled, sub: "보드 가득" };
  if (state.resources < cost) return { cost, disabled, sub: `부족 ${cost}` };
  return { cost, disabled, sub: `${cost}` };
}

function drawControls(refs: GameRefs, layout: GameLayout) {
  clear(refs.controls);
  const summonState = getSummonButtonState(refs.state);
  const summonW = layout.width * 0.52;
  const summon = button("소환", summonState.sub, summonW, 82, colors.yellow, () => summonAction(refs), { disabled: summonState.disabled || refs.movementLocked, subFill: summonState.disabled ? 0x3b3127 : colors.black });
  summon.x = (layout.width - summonW) / 2;
  summon.y = layout.height - 108;
  refs.controls.addChild(summon);

  const mythicReady = getMythicCraftAvailability(refs.state).some((item) => item.canCraft);
  const mythic = button("신화", mythicReady ? "가능" : "조합", 92, 68, colors.orange, () => showMythicMenu(refs), { disabled: isFinished(refs.state) || refs.movementLocked });
  mythic.x = 18;
  mythic.y = layout.height - 104;
  refs.controls.addChild(mythic);

  const gamble = button("도박", "행운석 2", 92, 68, colors.blue, () => gambleAction(refs), { disabled: isFinished(refs.state) || isBoardFull(refs.state.board) || refs.state.luckStones < 2 || refs.movementLocked });
  gamble.x = layout.width - 110;
  gamble.y = layout.height - 104;
  refs.controls.addChild(gamble);

  const upgradeCost = getPowerUpgradeCost(refs.state.powerUpgradeLevel);
  const upgrade = button("공격력 강화", `Lv.${refs.state.powerUpgradeLevel} / ${upgradeCost}`, 174, 42, 0x47584a, () => attackUpgradeAction(refs), { disabled: isFinished(refs.state) || refs.state.resources < upgradeCost || refs.movementLocked });
  upgrade.x = (layout.width - 174) / 2;
  upgrade.y = layout.height - 154;
  refs.controls.addChild(upgrade);

  const phaseLabel = refs.wavePhase === "combat" ? "전투 중" : refs.wavePhase === "result" ? "정산" : "자동 진행";
  const wave = button("웨이브", phaseLabel, 112, 48, refs.wavePhase === "combat" ? colors.red : colors.orange, () => featureAction(refs, "웨이브는 자동으로 진행돼요"), { disabled: isFinished(refs.state) || refs.movementLocked });
  wave.x = layout.width - 132;
  wave.y = layout.mapTop + 105;
  refs.controls.addChild(wave);
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const t = text(value, 22, color);
  t.anchor.set(0.5);
  t.x = x;
  t.y = y;
  refs.effects.addChild(t);
  addAnim(refs, { duration: 700, update: (p) => { t.y = y - p * 46; t.alpha = 1 - p; t.scale.set(1 + p * 0.2); }, done: () => t.destroy() });
}

function featureAction(refs: GameRefs, message: string) {
  floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.white);
}

function drawMonsterShape(target: Container, boss: boolean, size: number) {
  const body = new Graphics();
  body.roundRect(-size * (boss ? 1.25 : 1), -size * 0.85, size * (boss ? 2.5 : 2), size * (boss ? 2.1 : 1.7), size * 0.4);
  body.fill({ color: boss ? 0x8b3d34 : 0x54b336, alpha: 1 });
  body.stroke({ color: 0x2b331d, width: boss ? 4 : 2 });
  target.addChild(body);

  const eyes = new Graphics();
  eyes.circle(-size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.circle(size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.fill({ color: boss ? colors.yellow : colors.white, alpha: 1 });
  target.addChild(eyes);
}

function showBossWarning(refs: GameRefs) {
  const warning = text("⚠ BOSS WAVE ⚠", 32, colors.red);
  warning.anchor.set(0.5);
  warning.x = refs.app.renderer.width / 2;
  warning.y = refs.app.renderer.height * 0.26;
  refs.effects.addChild(warning);
  addAnim(refs, {
    duration: 1350,
    update: (p) => {
      warning.alpha = Math.sin(p * Math.PI * 6) > 0 ? 1 : 0.35;
      warning.scale.set(1 + Math.sin(p * Math.PI) * 0.28);
    },
    done: () => warning.destroy(),
  });
}

function spawnMonsters(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const wave = getWaveByNumber(refs.state.currentWave);
  const boss = Boolean(wave?.isBossWave) || isBossWave(refs.state);
  const count = boss ? 1 : Math.min(12, wave?.enemyGroups.reduce((sum, group) => sum + group.count, 0) ?? 7);
  refs.activeEnemies = [];
  if (boss) showBossWarning(refs);

  for (let i = 0; i < count; i += 1) {
    const monster = new Container();
    drawMonsterShape(monster, boss, boss ? 24 : 12);
    refs.effects.addChild(monster);
    const enemy: ActiveEnemy = { id: refs.nextEnemyId++, x: 0, y: 0, alive: true, boss };
    refs.activeEnemies.push(enemy);

    addAnim(refs, {
      duration: WAVE_COMBAT_SECONDS * 1000 + i * 110,
      update: (p) => {
        const spawnDelay = i * 0.018;
        const point = getPathPoint(layout, Math.max(0, Math.min(1, p - spawnDelay)));
        monster.x = point.x;
        monster.y = point.y;
        monster.rotation = Math.sin(p * 24) * (boss ? 0.04 : 0.08);
        enemy.x = point.x;
        enemy.y = point.y;
      },
      done: () => {
        enemy.alive = false;
        monster.destroy({ children: true });
      },
    });
  }
}

function pickAttackTarget(refs: GameRefs): ActiveEnemy {
  const liveEnemies = refs.activeEnemies.filter((enemy) => enemy.alive);
  if (liveEnemies.length > 0) return liveEnemies[Math.floor(refs.random() * liveEnemies.length)] ?? liveEnemies[0]!;
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  const point = getPathPoint(layout, 0.5);
  return { id: -1, x: point.x, y: point.y, alive: true, boss: false };
}

function spawnAttackEffects(refs: GameRefs) {
  const heroes = getAllBoardHeroes(refs.state.board);
  if (heroes.length === 0) return;
  const target = pickAttackTarget(refs);
  heroes.slice(0, Math.min(heroes.length, 7)).forEach((hero, index) => {
    const fromIndex = hero.position.row * refs.state.boardSize.columns + hero.position.column;
    const from = getCellCenter(refs, fromIndex);
    const projectile = new Graphics();
    projectile.circle(0, 0, hero.grade === "mythic" ? 5 : 3.5);
    projectile.fill({ color: gradeColor(hero.grade), alpha: 1 });
    projectile.x = from.x;
    projectile.y = from.y;
    refs.effects.addChild(projectile);

    addAnim(refs, {
      duration: 360 + index * 22,
      update: (p) => {
        const eased = 1 - Math.pow(1 - p, 2);
        projectile.x = from.x + (target.x - from.x) * eased;
        projectile.y = from.y + (target.y - from.y) * eased;
        projectile.alpha = 1 - p * 0.2;
      },
      done: () => {
        projectile.destroy();
        if (index === 0) {
          const damage = Math.max(1, Math.floor(calculateBoardPower(refs.state).totalPower / 9));
          floatText(refs, `${damage}`, target.x, target.y - 18, colors.yellow);
        }
      },
    });
  });
}

function summonAction(refs: GameRefs) {
  clearMenu(refs);
  const summonState = getSummonButtonState(refs.state);
  if (summonState.disabled || refs.movementLocked) { floatText(refs, summonState.sub, refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red); return; }
  const result = summonHero(refs.state, refs.random);
  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.summonedHero);
  render(refs);
  floatText(refs, result.summonedHero ? "소환!" : "실패", refs.app.renderer.width / 2, refs.app.renderer.height - 140, result.summonedHero ? colors.yellow : colors.red);
  if (result.summonedHero) addAnim(refs, { duration: 420, update: (p) => { if (p > 0.8) refs.lastSummonedIndex = null; drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height)); } });
}

function gambleAction(refs: GameRefs) {
  clearMenu(refs);
  if (refs.movementLocked) return;
  const result = gambleSummon(refs.state, "epic-gamble", refs.random);
  if (!result.summonedHero) { const message = result.reason === "not_enough_luck_stones" ? "행운석 부족" : result.reason === "board_full" ? "보드 가득" : "도박 실패"; floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red); return; }
  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.summonedHero);
  render(refs);
  floatText(refs, result.success ? "도박 성공!" : "보정 소환", refs.app.renderer.width / 2, refs.app.renderer.height - 140, result.success ? colors.yellow : colors.blue);
  addAnim(refs, { duration: 420, update: (p) => { if (p > 0.8) refs.lastSummonedIndex = null; drawBoard(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height)); } });
}

function attackUpgradeAction(refs: GameRefs) {
  clearMenu(refs);
  if (refs.movementLocked) return;
  const result = upgradeAttack(refs.state);
  refs.state = result.state;
  render(refs);
  floatText(refs, result.upgraded ? `공격력 강화 +${refs.state.powerUpgradeLevel}` : `코인 부족 ${result.cost}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, result.upgraded ? colors.yellow : colors.red);
}

function showMythicMenu(refs: GameRefs) {
  clearMenu(refs);
  const list = getMythicCraftAvailability(refs.state);
  const w = Math.min(344, refs.app.renderer.width - 24);
  const h = 64 + list.length * 48;
  const menu = new Container();
  menu.x = refs.app.renderer.width / 2 - w / 2;
  menu.y = Math.max(18, refs.app.renderer.height * 0.17);
  menu.addChild(panel(w, h, 0x2d2925, colors.orange, 16));

  const title = text("신화 / 오버드라이브 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = w / 2;
  title.y = 14;
  menu.addChild(title);

  list.forEach((item, index) => {
    const y = 52 + index * 48;
    const row = new Container();
    row.x = 12;
    row.y = y;
    row.eventMode = item.canCraft ? "static" : "none";
    row.cursor = item.canCraft ? "pointer" : "default";
    const bg = panel(w - 24, 40, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10);
    row.addChild(bg);
    const name = text(item.recipe.displayName, 14, item.canCraft ? colors.white : 0xb7afa8);
    name.x = 12;
    name.y = 5;
    row.addChild(name);
    const cost = text(`행운석 ${item.recipe.luckStoneCost}${item.canCraft ? "" : " / 재료 부족"}`, 11, item.canCraft ? colors.yellow : 0xb7afa8);
    cost.x = 12;
    cost.y = 22;
    row.addChild(cost);
    if (item.canCraft) row.on("pointertap", () => mythicCraftAction(refs, item.recipe.id));
    menu.addChild(row);
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

function mythicCraftAction(refs: GameRefs, recipeId: string) {
  clearMenu(refs);
  const result = craftMythicHero(refs.state, recipeId);
  if (!result.craftedHero) {
    floatText(refs, result.reason === "not_enough_luck_stones" ? "행운석 부족" : "조합 재료 부족", refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.red);
    return;
  }
  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.craftedHero);
  render(refs);
  floatText(refs, "오버드라이브 완성!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.yellow);
}

function getWaveResultMessage(result: WaveProgressResult): { label: string; color: number } {
  if (result.state.status === "failed") return { label: `패배... -${result.lostLives} HP`, color: colors.red };
  if (result.lostLives > 0) { const leakedCount = result.leakedEnemies.reduce((sum, group) => sum + group.count, 0); return { label: `누수 ${leakedCount}마리  -${result.lostLives} HP`, color: colors.orange }; }
  return { label: "완벽 방어!", color: colors.green };
}

function showWaveResult(refs: GameRefs, result: WaveProgressResult) {
  const waveMessage = getWaveResultMessage(result);
  floatText(refs, waveMessage.label, refs.app.renderer.width / 2, refs.app.renderer.height * 0.38, waveMessage.color);
  floatText(refs, `전투력 ${result.boardPower} / 위협도 ${result.waveThreat}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.46, colors.white);
  floatText(refs, `코인 +${result.reward}  행운석 +${result.luckStoneReward}`, refs.app.renderer.width / 2, refs.app.renderer.height - 132, colors.green);
}

function startAutoWave(refs: GameRefs) {
  if (isFinished(refs.state) || refs.wavePhase === "combat") return;
  refs.wavePhase = "combat";
  refs.combatTimer = WAVE_COMBAT_SECONDS;
  refs.attackTimer = 0.25;
  refs.state = startWave(refs.state);
  render(refs);
  spawnMonsters(refs);
}

function finishAutoWave(refs: GameRefs) {
  refs.activeEnemies = [];
  const result = completeCurrentWave(refs.state);
  refs.state = result.state;
  refs.wavePhase = "result";
  refs.resultTimer = WAVE_RESULT_SECONDS;
  render(refs);
  showWaveResult(refs, result);
}

function render(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, layout);
  drawTopHud(refs, layout);
  drawBoard(refs, layout);
  drawControls(refs, layout);
}

function tick(refs: GameRefs, deltaMs: number) {
  const deltaSeconds = deltaMs / 1000;
  refs.animations = refs.animations.filter((a) => {
    a.age += deltaMs;
    const p = Math.min(1, a.age / a.duration);
    a.update(p);
    if (p >= 1) { a.done?.(); return false; }
    return true;
  });

  if (isFinished(refs.state)) return;

  if (refs.wavePhase === "countdown") {
    refs.nextWaveTimer -= deltaSeconds;
    if (refs.nextWaveTimer <= 0) startAutoWave(refs);
    else drawTopHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    return;
  }

  if (refs.wavePhase === "combat") {
    refs.combatTimer -= deltaSeconds;
    refs.attackTimer -= deltaSeconds;
    if (refs.attackTimer <= 0) {
      refs.attackTimer = isBossWave(refs.state) ? 0.34 : 0.48;
      spawnAttackEffects(refs);
    }
    drawTopHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    if (refs.combatTimer <= 0) finishAutoWave(refs);
    return;
  }

  refs.resultTimer -= deltaSeconds;
  if (refs.resultTimer <= 0) {
    refs.wavePhase = "countdown";
    refs.nextWaveTimer = WAVE_COUNTDOWN_SECONDS;
    render(refs);
  }
}

export function createPixiGame(parent: HTMLElement): PixiGameHandle {
  const app = new Application();
  const stage = new Container();
  const seed = `pixi-${Date.now()}`;
  const refs = {
    app,
    stage,
    world: new Container(),
    board: new Container(),
    hud: new Container(),
    controls: new Container(),
    effects: new Container(),
    menuLayer: new Container(),
    state: createInitialGameState(seed),
    random: createSeededRandom(seed),
    animations: [],
    lastSummonedIndex: null,
    dragging: null,
    movementLocked: false,
    menu: null,
    wavePhase: "countdown",
    nextWaveTimer: WAVE_COUNTDOWN_SECONDS,
    combatTimer: 0,
    resultTimer: 0,
    attackTimer: 0,
    activeEnemies: [],
    nextEnemyId: 1,
  } satisfies GameRefs;

  let destroyed = false;

  async function init() {
    await app.init({ background: colors.sky, resizeTo: parent, antialias: true, resolution: Math.min(window.devicePixelRatio || 1, 2), autoDensity: true });
    if (destroyed) { app.destroy(true); return; }
    parent.appendChild(app.canvas);
    app.stage.addChild(stage);
    stage.eventMode = "static";
    stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));
    stage.on("pointerup", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
    stage.on("pointerupoutside", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);
    render(refs);
    app.renderer.on("resize", () => { stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height); clearMenu(refs); render(refs); });
    app.ticker.add((ticker) => tick(refs, ticker.deltaMS));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      clearMenu(refs);
      clearDrag(refs);
      app.destroy(true, { children: true });
    },
  };
}
