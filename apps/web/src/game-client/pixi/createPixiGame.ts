import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";
import {
  canMergeStackCell,
  craftMythicHero,
  createInitialGameState,
  createSeededRandom,
  gambleSummon,
  getAllBoardHeroes,
  getBoardCapacity,
  getBoardUnitCount,
  getEnemyById,
  getHeroById,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  getWaveByNumber,
  initialBalance,
  isBoardFull,
  mergeStackedCell,
  moveOneHeroToCell,
  sellTopUnitInCell,
  startWave,
  summonHero,
  upgradeAttack,
} from "@discord-random-defense/game";
import type { BoardHero, GameState, HeroRole } from "@discord-random-defense/game";
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
  enemyId: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  reward: number;
  damageToLife: number;
  progress: number;
  speed: number;
  alive: boolean;
  boss: boolean;
  sprite: Container;
};

type WaveSummary = {
  killed: number;
  leaked: number;
  lostLives: number;
  reward: number;
  luckStoneReward: number;
  perfect: boolean;
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
  waveKilled: number;
  waveReward: number;
  waveLostLives: number;
  lastWaveSummary: WaveSummary | null;
};

const WAVE_COUNTDOWN_SECONDS = 8;
const WAVE_COMBAT_SECONDS = 14;
const WAVE_RESULT_SECONDS = 1.4;
const MAX_ATTACKERS_PER_TICK = 10;

function makeText(value: string, size = 18, fill: number = colors.white) {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: "bold",
      stroke: { color: colors.black, width: size > 18 ? 4 : 2 },
    },
  });
}

function makePanel(width: number, height: number, fill: number, stroke = colors.panelDark, radius = 16) {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, radius);
  panel.fill({ color: fill, alpha: 1 });
  panel.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return panel;
}

function clear(container: Container) {
  container.removeChildren();
}

function isFinished(state: GameState) {
  return state.status === "failed" || state.status === "cleared";
}

function isBossWave(state: GameState) {
  return state.currentWave % initialBalance.bossWaveInterval === 0;
}

function addAnimation(refs: GameRefs, animation: Omit<Animation, "age">) {
  refs.animations.push({ ...animation, age: 0 });
}

function clearMenu(refs: GameRefs) {
  refs.menu?.destroy({ children: true });
  refs.menu = null;
}

function clearDrag(refs: GameRefs) {
  refs.dragging?.ghost.destroy({ children: true });
  refs.dragging = null;
}

function getCellIndexFromHero(state: GameState, hero: BoardHero | null) {
  if (!hero) return null;
  return hero.position.row * state.boardSize.columns + hero.position.column;
}

function getBoardMetrics(refs: GameRefs, layout: GameLayout): BoardMetrics {
  const gap = 7;
  const cols = refs.state.boardSize.columns;
  const rows = refs.state.boardSize.rows;
  const cell = Math.min(
    (layout.boardWidth - 34 - gap * (cols - 1)) / cols,
    (layout.boardHeight - 32 - gap * (rows - 1)) / rows,
  );

  return {
    cols,
    rows,
    cell,
    gap,
    startX: layout.boardX + (layout.boardWidth - cell * cols - gap * (cols - 1)) / 2,
    startY: layout.boardY + 16,
  };
}

function getCellCenter(refs: GameRefs, cellIndex: number) {
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

function getCellIndexAtPoint(refs: GameRefs, x: number, y: number) {
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

function roleAccent(role: HeroRole | undefined) {
  if (role === "tank") return 0x87b7ff;
  if (role === "support") return 0x7dffb2;
  return 0xffd166;
}

function drawUnitShape(target: Container, hero: Pick<BoardHero, "grade" | "heroId">, cell: number, scale = 1) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const accent = roleAccent(role);

  const shadow = new Graphics();
  shadow.ellipse(0, cell * 0.24 * scale, cell * 0.2 * scale, cell * 0.06 * scale);
  shadow.fill({ color: 0x244f1e, alpha: 0.28 });
  target.addChild(shadow);

  if (role === "support") {
    const aura = new Graphics();
    aura.circle(0, 0, cell * 0.31 * scale);
    aura.stroke({ color: accent, width: Math.max(2, 3 * scale), alpha: 0.58 });
    target.addChild(aura);
  }

  const body = new Graphics();
  if (role === "tank") {
    body.roundRect(-cell * 0.24 * scale, -cell * 0.1 * scale, cell * 0.48 * scale, cell * 0.42 * scale, cell * 0.12 * scale);
  } else if (role === "support") {
    body.circle(0, cell * 0.02 * scale, cell * 0.2 * scale);
  } else {
    body.moveTo(0, -cell * 0.24 * scale);
    body.lineTo(cell * 0.24 * scale, cell * 0.2 * scale);
    body.lineTo(-cell * 0.24 * scale, cell * 0.2 * scale);
    body.lineTo(0, -cell * 0.24 * scale);
  }
  body.fill({ color: gradeColor(hero.grade), alpha: 1 });
  body.stroke({ color: colors.black, width: Math.max(2, 3 * scale), alpha: 0.58 });
  target.addChild(body);

  const head = new Graphics();
  head.circle(0, -cell * 0.2 * scale, cell * 0.13 * scale);
  head.fill({ color: 0xffd0a6, alpha: 1 });
  head.stroke({ color: colors.black, width: Math.max(1.5, 2 * scale), alpha: 0.56 });
  target.addChild(head);

  if (role === "damage") {
    const barrel = new Graphics();
    barrel.roundRect(cell * 0.08 * scale, -cell * 0.02 * scale, cell * 0.24 * scale, cell * 0.07 * scale, cell * 0.03 * scale);
    barrel.fill({ color: 0x2f2f35, alpha: 1 });
    target.addChild(barrel);
  }

  if (hero.grade === "mythic") {
    const halo = new Graphics();
    halo.circle(0, -cell * 0.04 * scale, cell * 0.36 * scale);
    halo.stroke({ color: colors.yellow, width: Math.max(2, 4 * scale), alpha: 0.8 });
    target.addChild(halo);
  }
}

function createUnitGhost(hero: Pick<BoardHero, "grade" | "heroId">, cell: number, alpha = 0.92) {
  const ghost = new Container();
  ghost.alpha = alpha;
  drawUnitShape(ghost, hero, cell, 0.94);
  return ghost;
}

function beginCellDrag(refs: GameRefs, sourceIndex: number, globalX: number, globalY: number, cell: number) {
  if (isFinished(refs.state) || refs.movementLocked) return;
  const sourceCell = refs.state.board[sourceIndex];
  const movingHero = sourceCell?.units[sourceCell.units.length - 1];
  if (!movingHero) return;

  clearMenu(refs);
  clearDrag(refs);
  const ghost = createUnitGhost(movingHero, cell, 0);
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
  const ghost = createUnitGhost(hero, from.cell, 0.95);
  ghost.x = from.x;
  ghost.y = from.y;
  refs.effects.addChild(ghost);

  addAnimation(refs, {
    duration: 420,
    update: (progress) => {
      const eased = 1 - Math.pow(1 - progress, 3);
      const bob = Math.sin(progress * Math.PI * 4) * from.cell * 0.04;
      ghost.x = from.x + (to.x - from.x) * eased;
      ghost.y = from.y + (to.y - from.y) * eased + bob;
      ghost.rotation = Math.sin(progress * Math.PI * 6) * 0.08;
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
    floatText(refs, action === "swap" ? "자리 교환" : action === "stack" ? "중첩" : "이동", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, action === "swap" ? colors.orange : colors.green);
  };

  if (action === "swap" && targetCell?.units[0]) {
    let completed = 0;
    const onDone = () => {
      completed += 1;
      if (completed >= 2) finish();
    };
    animateWalk(refs, movingHero, sourceIndex, targetIndex, onDone);
    animateWalk(refs, targetCell.units[0], targetIndex, sourceIndex, onDone);
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

function makeMenuButton(label: string, x: number, y: number, enabled: boolean, onTap: () => void) {
  const container = new Container();
  container.x = x;
  container.y = y;
  container.eventMode = enabled ? "static" : "none";
  container.cursor = enabled ? "pointer" : "default";
  container.addChild(makePanel(58, 34, enabled ? colors.panel : 0x655e59, enabled ? 0x2e241f : 0x3d3732, 10));

  const labelText = makeText(label, 14, enabled ? colors.white : 0xb7afa8);
  labelText.anchor.set(0.5);
  labelText.x = 29;
  labelText.y = 17;
  container.addChild(labelText);

  if (enabled) {
    container.on("pointertap", (event: any) => {
      event.stopPropagation();
      onTap();
    });
  }

  return container;
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
  const background = makePanel(124, 42, 0x2d2925, 0x1d1714, 12);
  background.alpha = 0.92;
  menu.addChild(background);
  menu.addChild(makeMenuButton("합성", 4, 4, canMerge, () => mergeMenuAction(refs, cellIndex)));
  menu.addChild(makeMenuButton("판매", 62, 4, true, () => sellMenuAction(refs, cellIndex)));
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

  const background = new Graphics();
  background.rect(0, 0, layout.width, layout.height);
  background.fill(colors.sky);
  refs.world.addChild(background);

  const road = new Graphics();
  const first = getPathPoint(layout, 0);
  road.moveTo(first.x, first.y);
  for (let index = 1; index <= 80; index += 1) {
    const point = getPathPoint(layout, index / 80);
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
}

function drawTopHud(refs: GameRefs, layout: GameLayout) {
  clear(refs.hud);

  const boss = isBossWave(refs.state);
  const waveBox = makePanel(150, 58, boss ? 0x5a2327 : colors.panel, boss ? colors.red : 0x3b2d26, 12);
  waveBox.x = layout.width / 2 - 75;
  waveBox.y = layout.topHudY;
  refs.hud.addChild(waveBox);

  const wave = makeText(`WAVE ${refs.state.currentWave}`, 18);
  wave.anchor.set(0.5, 0);
  wave.x = layout.width / 2;
  wave.y = layout.topHudY + 7;
  refs.hud.addChild(wave);

  const timerLabel = refs.wavePhase === "combat" ? `${Math.ceil(refs.combatTimer)}s` : refs.wavePhase === "result" ? "RESULT" : `${Math.ceil(refs.nextWaveTimer)}s`;
  const timer = makeText(boss ? `BOSS ${timerLabel}` : `NEXT ${timerLabel}`, 20, boss ? colors.red : colors.white);
  timer.anchor.set(0.5, 0);
  timer.x = layout.width / 2;
  timer.y = layout.topHudY + 30;
  refs.hud.addChild(timer);

  const hpBackground = makePanel(layout.width - 92, 24, 0x4d2228, 0x2f1519, 12);
  hpBackground.x = 46;
  hpBackground.y = layout.topHudY + 66;
  refs.hud.addChild(hpBackground);

  const hpRatio = Math.max(0, Math.min(1, refs.state.lives / initialBalance.startingLives));
  const hp = new Graphics();
  hp.roundRect(50, layout.topHudY + 70, (layout.width - 100) * hpRatio, 16, 8);
  hp.fill({ color: colors.red, alpha: 1 });
  refs.hud.addChild(hp);

  const hpText = makeText(`${refs.state.lives} / ${initialBalance.startingLives}`, 16);
  hpText.anchor.set(0.5, 0);
  hpText.x = layout.width / 2;
  hpText.y = layout.topHudY + 67;
  refs.hud.addChild(hpText);

  const firepower = getAllBoardHeroes(refs.state.board).reduce((sum, hero) => sum + getHeroDamage(refs, hero), 0);
  const power = makeText(`화력 ${firepower}`, 15);
  power.x = 22;
  power.y = layout.topHudY + 98;
  refs.hud.addChild(power);

  const units = makeText(`${getBoardUnitCount(refs.state.board)} / ${getBoardCapacity(refs.state.board)}`, 15);
  units.x = layout.width - 96;
  units.y = layout.topHudY + 98;
  refs.hud.addChild(units);

  const coin = makeText(`코인 ${refs.state.resources}`, 18, colors.yellow);
  coin.x = 24;
  coin.y = layout.bottomY - 34;
  refs.hud.addChild(coin);

  const luck = makeText(`행운석 ${refs.state.luckStones}`, 16, colors.blue);
  luck.x = 24;
  luck.y = layout.bottomY - 58;
  refs.hud.addChild(luck);
}

function getStackOffset(stackCount: number, index: number, cell: number) {
  if (stackCount <= 1) return { x: 0, y: 0, scale: 1 };
  if (stackCount === 2) return index === 0 ? { x: -cell * 0.16, y: cell * 0.02, scale: 0.82 } : { x: cell * 0.16, y: cell * 0.02, scale: 0.82 };
  if (index === 0) return { x: 0, y: -cell * 0.15, scale: 0.74 };
  if (index === 1) return { x: -cell * 0.17, y: cell * 0.13, scale: 0.74 };
  return { x: cell * 0.17, y: cell * 0.13, scale: 0.74 };
}

function drawUnitMarker(refs: GameRefs, x: number, y: number, cell: number, hero: BoardHero, stackCount: number, stackIndex: number) {
  const offset = getStackOffset(stackCount, stackIndex, cell);
  const marker = new Container();
  marker.x = x + cell / 2 + offset.x;
  marker.y = y + cell * 0.48 + offset.y;
  drawUnitShape(marker, hero, cell, offset.scale);
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
    const canMerge = canMergeStackCell(refs.state, index);

    const cell = new Graphics();
    cell.roundRect(x, y, metrics.cell, metrics.cell, 12);
    cell.fill({ color: units.length > 0 ? 0x6ac144 : 0x539832, alpha: units.length > 0 ? 0.96 : 0.45 });
    cell.stroke({ color: canMerge ? colors.yellow : firstUnit ? gradeColor(firstUnit.grade) : 0x3e7629, width: units.length >= 3 ? 4 : units.length > 0 ? 3 : 2, alpha: 0.9 });
    refs.board.addChild(cell);

    units.forEach((unit, unitIndex) => drawUnitMarker(refs, x, y, metrics.cell, unit, units.length, unitIndex));

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

function makeButton(label: string, sub: string, width: number, height: number, color: number, onTap: () => void, disabled = false) {
  const container = new Container();
  container.eventMode = disabled ? "none" : "static";
  container.cursor = disabled ? "default" : "pointer";
  container.addChild(makePanel(width, height, disabled ? 0x6f6259 : color, disabled ? 0x3d332e : 0x51351e, 14));

  const subText = makeText(sub, 12, disabled ? 0x2d2825 : colors.black);
  subText.x = 16;
  subText.y = 9;
  container.addChild(subText);

  const mainText = makeText(label, 22, disabled ? 0xd0c6bc : colors.white);
  mainText.anchor.set(0.5, 0);
  mainText.x = width / 2;
  mainText.y = 31;
  container.addChild(mainText);

  if (!disabled) {
    container.on("pointertap", () => {
      container.scale.set(0.96);
      window.setTimeout(() => container.scale.set(1), 80);
      onTap();
    });
  }

  return container;
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
  const summonWidth = layout.width * 0.52;
  const summon = makeButton("소환", summonState.sub, summonWidth, 82, colors.yellow, () => summonAction(refs), summonState.disabled || refs.movementLocked);
  summon.x = (layout.width - summonWidth) / 2;
  summon.y = layout.height - 108;
  refs.controls.addChild(summon);

  const mythicReady = getMythicCraftAvailability(refs.state).some((item) => item.canCraft);
  const mythic = makeButton("신화", mythicReady ? "가능" : "조합", 92, 68, colors.orange, () => showMythicMenu(refs), isFinished(refs.state) || refs.movementLocked);
  mythic.x = 18;
  mythic.y = layout.height - 104;
  refs.controls.addChild(mythic);

  const gamble = makeButton("도박", "행운석 2", 92, 68, colors.blue, () => gambleAction(refs), isFinished(refs.state) || isBoardFull(refs.state.board) || refs.state.luckStones < 2 || refs.movementLocked);
  gamble.x = layout.width - 110;
  gamble.y = layout.height - 104;
  refs.controls.addChild(gamble);

  const upgradeCost = getPowerUpgradeCost(refs.state.powerUpgradeLevel);
  const upgrade = makeButton("공격력 강화", `Lv.${refs.state.powerUpgradeLevel} / ${upgradeCost}`, 174, 42, 0x47584a, () => attackUpgradeAction(refs), isFinished(refs.state) || refs.state.resources < upgradeCost || refs.movementLocked);
  upgrade.x = (layout.width - 174) / 2;
  upgrade.y = layout.height - 154;
  refs.controls.addChild(upgrade);

  const phaseLabel = refs.wavePhase === "combat" ? `${refs.activeEnemies.filter((enemy) => enemy.alive).length}마리` : refs.wavePhase === "result" ? "정산" : "자동 진행";
  const wave = makeButton("웨이브", phaseLabel, 112, 48, refs.wavePhase === "combat" ? colors.red : colors.orange, () => featureAction(refs, "웨이브는 자동으로 진행돼요"), isFinished(refs.state) || refs.movementLocked);
  wave.x = layout.width - 132;
  wave.y = layout.mapTop + 105;
  refs.controls.addChild(wave);
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const floatingText = makeText(value, 22, color);
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  refs.effects.addChild(floatingText);

  addAnimation(refs, {
    duration: 700,
    update: (progress) => {
      floatingText.y = y - progress * 46;
      floatingText.alpha = 1 - progress;
      floatingText.scale.set(1 + progress * 0.2);
    },
    done: () => floatingText.destroy(),
  });
}

function featureAction(refs: GameRefs, message: string) {
  floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.white);
}

function drawMonsterShape(target: Container, boss: boolean, size: number, enemyId: string) {
  const fill = enemyId === "ping-runner" ? 0x56c8ff : enemyId === "lag-chunk" ? 0x8b7d69 : enemyId === "elite-bug" ? 0xa45bd8 : boss ? 0x8b3d34 : 0x54b336;
  const body = new Graphics();
  body.roundRect(-size * (boss ? 1.25 : 1), -size * 0.85, size * (boss ? 2.5 : 2), size * (boss ? 2.1 : 1.7), size * 0.4);
  body.fill({ color: fill, alpha: 1 });
  body.stroke({ color: 0x2b331d, width: boss ? 4 : 2 });
  target.addChild(body);

  const eyes = new Graphics();
  eyes.circle(-size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.circle(size * 0.35, -size * 0.15, Math.max(2, size * 0.12));
  eyes.fill({ color: boss ? colors.yellow : colors.white, alpha: 1 });
  target.addChild(eyes);
}

function drawEnemyHpBar(enemy: ActiveEnemy) {
  enemy.sprite.getChildByName("hpbar")?.destroy();
  const container = new Container();
  container.name = "hpbar";
  container.y = enemy.boss ? -38 : -24;
  const width = enemy.boss ? 56 : 32;

  const background = new Graphics();
  background.roundRect(-width / 2, 0, width, 5, 3);
  background.fill({ color: 0x2a1515, alpha: 0.9 });
  container.addChild(background);

  const fill = new Graphics();
  fill.roundRect(-width / 2, 0, width * Math.max(0, enemy.hp / enemy.maxHp), 5, 3);
  fill.fill({ color: enemy.boss ? colors.red : colors.green, alpha: 1 });
  container.addChild(fill);
  enemy.sprite.addChild(container);
}

function showBossWarning(refs: GameRefs) {
  const warning = makeText("⚠ BOSS WAVE ⚠", 32, colors.red);
  warning.anchor.set(0.5);
  warning.x = refs.app.renderer.width / 2;
  warning.y = refs.app.renderer.height * 0.26;
  refs.effects.addChild(warning);

  addAnimation(refs, {
    duration: 1350,
    update: (progress) => {
      warning.alpha = Math.sin(progress * Math.PI * 6) > 0 ? 1 : 0.35;
      warning.scale.set(1 + Math.sin(progress * Math.PI) * 0.28);
    },
    done: () => warning.destroy(),
  });
}

function createEnemy(refs: GameRefs, enemyId: string, bossOverride = false): ActiveEnemy | null {
  const definition = getEnemyById(enemyId);
  if (!definition) return null;

  const boss = bossOverride || definition.type === "boss";
  const wave = refs.state.currentWave;
  const hpScale = 0.68 + wave * 0.11 + (boss ? wave * 0.16 : 0);
  const maxHp = Math.round(definition.health * hpScale);
  const sprite = new Container();
  drawMonsterShape(sprite, boss, boss ? 24 : definition.type === "tank" || definition.type === "elite" ? 16 : 12, enemyId);
  refs.effects.addChild(sprite);

  const enemy: ActiveEnemy = {
    id: refs.nextEnemyId,
    enemyId,
    x: 0,
    y: 0,
    hp: maxHp,
    maxHp,
    reward: definition.reward,
    damageToLife: definition.damageToLife,
    progress: 0,
    speed: definition.speed * (boss ? 0.72 : 1),
    alive: true,
    boss,
    sprite,
  };
  refs.nextEnemyId += 1;
  drawEnemyHpBar(enemy);
  return enemy;
}

function spawnMonsters(refs: GameRefs) {
  refs.activeEnemies.forEach((enemy) => enemy.sprite.destroy({ children: true }));
  refs.activeEnemies = [];
  refs.waveKilled = 0;
  refs.waveReward = 0;
  refs.waveLostLives = 0;

  const wave = getWaveByNumber(refs.state.currentWave);
  if (!wave) return;
  if (wave.isBossWave) showBossWarning(refs);

  for (const group of wave.enemyGroups) {
    for (let index = 0; index < group.count; index += 1) {
      const enemy = createEnemy(refs, group.enemyId, wave.isBossWave && group.enemyId === "server-crasher");
      if (!enemy) continue;
      enemy.progress = -((group.spawnIntervalMs / 1000) * index * 0.075);
      refs.activeEnemies.push(enemy);
    }
  }
}

function updateEnemies(refs: GameRefs, deltaSeconds: number) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);

  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive) continue;
    enemy.progress += (deltaSeconds * enemy.speed) / WAVE_COMBAT_SECONDS;

    if (enemy.progress >= 1) {
      enemy.alive = false;
      refs.waveLostLives += enemy.damageToLife;
      enemy.sprite.destroy({ children: true });
      floatText(refs, `누수 -${enemy.damageToLife}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.35, colors.red);
      continue;
    }

    const point = getPathPoint(layout, Math.max(0, enemy.progress));
    enemy.x = point.x;
    enemy.y = point.y;
    enemy.sprite.x = point.x;
    enemy.sprite.y = point.y;
    enemy.sprite.rotation = Math.sin(enemy.progress * 24) * (enemy.boss ? 0.04 : 0.08);
  }
}

function pickAttackTarget(refs: GameRefs, role: HeroRole | undefined): ActiveEnemy | null {
  const liveEnemies = refs.activeEnemies.filter((enemy) => enemy.alive && enemy.progress >= 0);
  if (liveEnemies.length === 0) return null;

  if (role === "damage") {
    const boss = liveEnemies.find((enemy) => enemy.boss);
    if (boss) return boss;
  }

  liveEnemies.sort((a, b) => b.progress - a.progress);
  return liveEnemies[0] ?? null;
}

function getHeroDamage(refs: GameRefs, hero: BoardHero) {
  const definition = getHeroById(hero.heroId);
  const role = definition?.role ?? "damage";
  const gradeBase = hero.grade === "mythic" ? 150 : hero.grade === "legendary" ? 95 : hero.grade === "epic" ? 52 : hero.grade === "rare" ? 28 : 16;
  const roleMultiplier = role === "damage" ? 1.18 : role === "tank" ? 0.82 : 0.72;
  return Math.round(gradeBase * roleMultiplier * (1 + refs.state.powerUpgradeLevel * 0.16));
}

function damageEnemy(refs: GameRefs, enemy: ActiveEnemy, damage: number) {
  if (!enemy.alive) return;

  enemy.hp = Math.max(0, enemy.hp - damage);
  drawEnemyHpBar(enemy);
  if (enemy.hp > 0) return;

  enemy.alive = false;
  refs.waveKilled += 1;
  refs.waveReward += enemy.reward;
  refs.state = {
    ...refs.state,
    resources: refs.state.resources + enemy.reward,
    defeatedEnemies: refs.state.defeatedEnemies + (enemy.boss ? 0 : 1),
    defeatedBosses: refs.state.defeatedBosses + (enemy.boss ? 1 : 0),
    score: refs.state.score + enemy.reward * 3 + (enemy.boss ? 250 : 20),
  };
  floatText(refs, `+${enemy.reward}`, enemy.x, enemy.y - 26, colors.green);
  enemy.sprite.destroy({ children: true });
  drawTopHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
  drawControls(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
}

function applyTankSlow(enemy: ActiveEnemy) {
  enemy.speed = Math.max(0.22, enemy.speed * 0.92);
}

function applySupportSplash(refs: GameRefs, target: ActiveEnemy, damage: number) {
  for (const enemy of refs.activeEnemies) {
    if (!enemy.alive || enemy.id === target.id) continue;
    if (Math.hypot(enemy.x - target.x, enemy.y - target.y) <= 72) {
      damageEnemy(refs, enemy, Math.max(1, Math.floor(damage * 0.35)));
    }
  }
}

function spawnAttackEffects(refs: GameRefs) {
  const heroes = getAllBoardHeroes(refs.state.board);
  if (heroes.length === 0) return;

  heroes.slice(0, Math.min(heroes.length, MAX_ATTACKERS_PER_TICK)).forEach((hero, index) => {
    const definition = getHeroById(hero.heroId);
    const role = definition?.role ?? "damage";
    const target = pickAttackTarget(refs, role);
    if (!target) return;

    const fromIndex = hero.position.row * refs.state.boardSize.columns + hero.position.column;
    const from = getCellCenter(refs, fromIndex);
    const damage = getHeroDamage(refs, hero);
    const projectile = new Graphics();
    projectile.circle(0, 0, hero.grade === "mythic" ? 5 : 3.5);
    projectile.fill({ color: roleAccent(role), alpha: 1 });
    projectile.x = from.x;
    projectile.y = from.y;
    refs.effects.addChild(projectile);
    const targetAtFire = { x: target.x, y: target.y };

    addAnimation(refs, {
      duration: 280 + index * 18,
      update: (progress) => {
        const eased = 1 - Math.pow(1 - progress, 2);
        projectile.x = from.x + (targetAtFire.x - from.x) * eased;
        projectile.y = from.y + (targetAtFire.y - from.y) * eased;
        projectile.alpha = 1 - progress * 0.2;
      },
      done: () => {
        projectile.destroy();
        if (!target.alive) return;
        if (role === "tank") applyTankSlow(target);
        damageEnemy(refs, target, damage);
        if (role === "support") applySupportSplash(refs, target, damage);
        if (index === 0) floatText(refs, `${damage}`, target.x, target.y - 18, colors.yellow);
      },
    });
  });
}

function summonAction(refs: GameRefs) {
  clearMenu(refs);
  const summonState = getSummonButtonState(refs.state);
  if (summonState.disabled || refs.movementLocked) {
    floatText(refs, summonState.sub, refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red);
    return;
  }

  const result = summonHero(refs.state, refs.random);
  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.summonedHero);
  render(refs);
  floatText(refs, result.summonedHero ? "소환!" : "실패", refs.app.renderer.width / 2, refs.app.renderer.height - 140, result.summonedHero ? colors.yellow : colors.red);
}

function gambleAction(refs: GameRefs) {
  clearMenu(refs);
  if (refs.movementLocked) return;

  const result = gambleSummon(refs.state, "epic-gamble", refs.random);
  if (!result.summonedHero) {
    const message = result.reason === "not_enough_luck_stones" ? "행운석 부족" : result.reason === "board_full" ? "보드 가득" : "도박 실패";
    floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height - 140, colors.red);
    return;
  }

  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.summonedHero);
  render(refs);
  floatText(refs, result.success ? "도박 성공!" : "보정 소환", refs.app.renderer.width / 2, refs.app.renderer.height - 140, result.success ? colors.yellow : colors.blue);
}

function attackUpgradeAction(refs: GameRefs) {
  clearMenu(refs);
  if (refs.movementLocked) return;

  const result = upgradeAttack(refs.state);
  refs.state = result.state;
  render(refs);
  floatText(refs, result.upgraded ? `공격력 강화 +${refs.state.powerUpgradeLevel}` : `코인 부족 ${result.cost}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, result.upgraded ? colors.yellow : colors.red);
}

function ingredientText(grade: string, role: string | undefined, count: number) {
  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : "신화";
  const roleLabel = role === "damage" ? "딜러" : role === "tank" ? "탱커" : role === "support" ? "지원" : "무관";
  return `${gradeLabel} ${roleLabel}x${count}`;
}

function showMythicMenu(refs: GameRefs) {
  clearMenu(refs);
  const list = getMythicCraftAvailability(refs.state);
  const width = Math.min(360, refs.app.renderer.width - 24);
  const height = 64 + list.length * 54;
  const menu = new Container();
  menu.x = refs.app.renderer.width / 2 - width / 2;
  menu.y = Math.max(18, refs.app.renderer.height * 0.14);
  menu.addChild(makePanel(width, height, 0x2d2925, colors.orange, 16));

  const title = makeText("신화 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 14;
  menu.addChild(title);

  list.forEach((item, index) => {
    const y = 52 + index * 54;
    const row = new Container();
    row.x = 12;
    row.y = y;
    row.eventMode = item.canCraft ? "static" : "none";
    row.cursor = item.canCraft ? "pointer" : "default";
    row.addChild(makePanel(width - 24, 46, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10));

    const name = makeText(item.recipe.displayName, 14, item.canCraft ? colors.white : 0xb7afa8);
    name.x = 12;
    name.y = 5;
    row.addChild(name);

    const parts = item.recipe.ingredients.map((ingredient) => ingredientText(ingredient.grade, ingredient.role, ingredient.count)).join(" + ");
    const recipe = makeText(parts, 10, item.canCraft ? colors.yellow : 0xb7afa8);
    recipe.x = 12;
    recipe.y = 25;
    row.addChild(recipe);

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
    floatText(refs, "조합 재료 부족", refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.red);
    return;
  }

  refs.state = result.state;
  refs.lastSummonedIndex = getCellIndexFromHero(refs.state, result.craftedHero);
  render(refs);
  floatText(refs, "신화 조합 완성!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.yellow);
}

function showWaveResult(refs: GameRefs, summary: WaveSummary) {
  const label = refs.state.status === "failed" ? `패배... -${summary.lostLives} HP` : summary.leaked > 0 ? `누수 ${summary.leaked}마리  -${summary.lostLives} HP` : "완벽 방어!";
  const color = refs.state.status === "failed" ? colors.red : summary.leaked > 0 ? colors.orange : colors.green;
  floatText(refs, label, refs.app.renderer.width / 2, refs.app.renderer.height * 0.38, color);
  floatText(refs, `처치 ${summary.killed} / 누수 ${summary.leaked}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.46, colors.white);
  floatText(refs, `처치 보상 +${summary.reward}${summary.luckStoneReward > 0 ? `  행운석 +${summary.luckStoneReward}` : ""}`, refs.app.renderer.width / 2, refs.app.renderer.height - 132, colors.green);
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
  const alive = refs.activeEnemies.filter((enemy) => enemy.alive);
  let lostLives = refs.waveLostLives;
  for (const enemy of alive) {
    lostLives += enemy.damageToLife;
    enemy.alive = false;
    enemy.sprite.destroy({ children: true });
  }

  const leaked = alive.length + refs.waveLostLives;
  const perfect = lostLives <= 0;
  const luckStoneReward = perfect ? (isBossWave(refs.state) ? 2 : refs.state.currentWave % 3 === 0 ? 1 : 0) : 0;
  const nextLives = Math.max(0, refs.state.lives - lostLives);
  const finalWave = refs.state.currentWave >= initialBalance.maxWave;
  const nextStatus = nextLives <= 0 ? "failed" : finalWave ? "cleared" : "playing";
  const nextWave = nextStatus === "playing" ? refs.state.currentWave + 1 : refs.state.currentWave;

  refs.activeEnemies = [];
  refs.lastWaveSummary = {
    killed: refs.waveKilled,
    leaked,
    lostLives,
    reward: refs.waveReward,
    luckStoneReward,
    perfect,
  };
  refs.state = {
    ...refs.state,
    lives: nextLives,
    luckStones: refs.state.luckStones + luckStoneReward,
    currentWave: nextWave,
    clearedWaves: refs.state.clearedWaves + (nextLives > 0 ? 1 : 0),
    status: nextStatus,
    score: refs.state.score + refs.waveKilled * 10 + (perfect ? 50 : 0),
  };
  refs.wavePhase = "result";
  refs.resultTimer = WAVE_RESULT_SECONDS;
  render(refs);
  showWaveResult(refs, refs.lastWaveSummary);
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
  refs.animations = refs.animations.filter((animation) => {
    animation.age += deltaMs;
    const progress = Math.min(1, animation.age / animation.duration);
    animation.update(progress);
    if (progress >= 1) {
      animation.done?.();
      return false;
    }
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
    updateEnemies(refs, deltaSeconds);
    if (refs.attackTimer <= 0) {
      refs.attackTimer = isBossWave(refs.state) ? 0.34 : 0.48;
      spawnAttackEffects(refs);
    }
    drawTopHud(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    drawControls(refs, createGameLayout(refs.app.renderer.width, refs.app.renderer.height));
    if (refs.combatTimer <= 0 || refs.activeEnemies.every((enemy) => !enemy.alive)) finishAutoWave(refs);
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
  const refs: GameRefs = {
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
    waveKilled: 0,
    waveReward: 0,
    waveLostLives: 0,
    lastWaveSummary: null,
  };

  let destroyed = false;

  async function init() {
    await app.init({
      background: colors.sky,
      resizeTo: parent,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });

    if (destroyed) {
      app.destroy(true);
      return;
    }

    parent.appendChild(app.canvas);
    app.stage.addChild(stage);
    stage.eventMode = "static";
    stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));
    stage.on("pointerup", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
    stage.on("pointerupoutside", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);
    render(refs);

    app.renderer.on("resize", () => {
      stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
      clearMenu(refs);
      render(refs);
    });

    app.ticker.add((ticker) => tick(refs, ticker.deltaMS));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      clearMenu(refs);
      clearDrag(refs);
      refs.activeEnemies.forEach((enemy) => enemy.sprite.destroy({ children: true }));
      app.destroy(true, { children: true });
    },
  };
}
