import { Application, Container, Rectangle } from "pixi.js";
import {
  createInitialGameState,
  createSeededRandom,
  getBoardCapacity,
  getBoardUnitCount,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  initialBalance,
  isBoardFull,
  startWave,
} from "@discord-random-defense/game";
import type { BoardHero, GameState } from "@discord-random-defense/game";
import {
  MAX_ATTACKERS_PER_TICK,
  WAVE_COMBAT_SECONDS,
  WAVE_COUNTDOWN_SECONDS,
  WAVE_RESULT_SECONDS,
  type ActiveEnemy,
  type GameRefs,
  type WaveSummary,
} from "./pixiGameTypes";
import { createGameLayout } from "./gameLayout";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import {
  createPixiHudView,
  invalidatePixiHudView,
  updatePixiHudView,
  type PixiHudView,
} from "./pixiHudView";
import {
  createPixiControlsView,
  invalidatePixiControlsView,
  updatePixiControlsView,
  type PixiControlsView,
} from "./pixiControlsView";
import { createActiveEnemy, destroyActiveEnemy } from "./pixiEnemyRuntime";
import { spawnWaveMonsters } from "./pixiWaveRuntime";
import { updateActiveEnemies } from "./pixiEnemyMovementRuntime";
import { calculatePixiFirepower, spawnAttackEffects } from "./pixiCombatRuntime";
import {
  drawBoardCells,
} from "./pixiBoardView";
import {
  getBoardMetrics,
  getCellCenter,
  getCellIndexAtPoint,
} from "./pixiBoardRuntime";
import {
  beginCellDrag,
  finishCellDrag,
  moveDragGhost,
  type PixiDragRuntimeOptions,
} from "./pixiDragRuntime";
import {
  canShowMergeIndicator,
  showUnitMenu,
  type PixiUnitActionRuntimeOptions,
} from "./pixiUnitActionRuntime";
import {
  attackUpgradeAction,
  gambleAction,
  showMythicMenu,
  summonAction,
  type PixiControlActionRuntimeOptions,
} from "./pixiControlActionRuntime";
import { submitGameRun } from "../submitGameRun";
import { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";
import { createFloatingText } from "./pixiFloatingTextView";
import { mountPixiGameLayers } from "./pixiGameLayerOrder";
import { clearPixiUnitInfoView, drawPixiUnitInfoView } from "./pixiUnitInfoView";
import { formatMythicRecipeText } from "./pixiMythicRecipeText";
import { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";
import { getPixiPathPoint } from "./pixiPathRuntime";
import { drawPixiBackgroundView } from "./pixiBackgroundView";
import {
  applyEconomyRewardBonus,
  applyLeakReduction,
  createPixiProgressBonuses,
  getPerfectWaveLuckStoneReward,
  getProgressHeroPower,
  type PixiProgressBonuses,
} from "./pixiProgressBonuses";

export type PixiGameHandle = { cleanup: () => void };


function makeText(value: string, size = 18, fill: number = colors.white) {
  return makePixiText(value, size, fill);
}

function makePanel(width: number, height: number, fill: number, stroke = colors.panelDark, radius = 16) {
  return makePixiPanel(width, height, fill, stroke, radius);
}

function clear(container: Container) {
  clearPixiContainer(container);
}

function isFinished(state: GameState) {
  return state.status === "failed" || state.status === "cleared";
}

function isBossWave(state: GameState) {
  return state.currentWave % initialBalance.bossWaveInterval === 0;
}

function addAnimation(refs: GameRefs, animation: Omit<PixiAnimation, "age">) {
  addPixiAnimation(refs.animations, animation);
}

function clearMenu(refs: GameRefs) {
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
}

function clearDrag(refs: GameRefs) {
  refs.dragging?.ghost.destroy({ children: true });
  refs.dragging = null;
}

function invalidateHud(refs: GameRefs) {
  invalidatePixiHudView(refs.hudView);
}

function invalidateControls(refs: GameRefs) {
  invalidatePixiControlsView(refs.controlsView);
}

function getCellIndexFromHero(state: GameState, hero: BoardHero | null) {
  if (!hero) return null;
  return hero.position.row * state.boardSize.columns + hero.position.column;
}

function getPathPoint(layout: GameLayout, progress: number) {
  const left = Math.max(24, layout.boardX - 42);
  const right = Math.min(layout.width - 24, layout.boardX + layout.boardWidth + 42);
  const top = Math.max(layout.mapTop + 44, layout.boardY - 50);
  const bottom = Math.min(layout.height - 176, layout.boardY + layout.boardHeight + 48);
  return getPixiPathPoint(layout, progress);
}

function drawBackground(refs: GameRefs, layout: GameLayout) {
  drawPixiBackgroundView(refs.world, layout, getPathPoint);
}

function getFirepower(refs: GameRefs) {
  return calculatePixiFirepower(refs);
}

function drawTopHud(refs: GameRefs, layout: GameLayout) {
  if (!refs.hudView) refs.hudView = createPixiHudView(refs.hud);
  updatePixiHudView(refs.hudView, layout, {
    currentWave: refs.state.currentWave,
    wavePhase: refs.wavePhase,
    countdownSeconds: refs.nextWaveTimer,
    combatSeconds: refs.combatTimer,
    lives: refs.state.lives,
    maxLives: initialBalance.startingLives,
    firepower: getFirepower(refs),
    unitCount: getBoardUnitCount(refs.state.board),
    unitCapacity: getBoardCapacity(refs.state.board),
    resources: refs.state.resources,
    luckStones: refs.state.luckStones,
    isBossWave: isBossWave(refs.state),
  });
}

function createControlActionRuntimeOptions(): PixiControlActionRuntimeOptions {
  return {
    clearMenu,
    clearMenuAndUnitInfo,
    getSummonButtonState,
    getCellIndexFromHero,
    render,
    floatText,
  };
}

function createUnitActionRuntimeOptions(): PixiUnitActionRuntimeOptions {
  return {
    clearMenu,
    clearMenuAndUnitInfo,
    drawSelectedUnitInfo,
    render,
    floatText,
  };
}

function createDragRuntimeOptions(): PixiDragRuntimeOptions {
  return {
    isFinished,
    clearMenu,
    clearUnitSelection,
    clearDrag,
    addAnimation,
    render,
    floatText,
    showUnitMenu: (refs, cellIndex) => showUnitMenu(refs, cellIndex, createUnitActionRuntimeOptions()),
  };
}

function drawBoard(refs: GameRefs, layout: GameLayout) {
  const metrics = getBoardMetrics(refs, layout);
  drawBoardCells(refs.board, refs.state.board, metrics, (cellIndex) => canShowMergeIndicator(refs, cellIndex), {
    canDrag: !refs.movementLocked,
    onCellPointerDown: (cellIndex, globalX, globalY, cellSize) => beginCellDrag(refs, cellIndex, globalX, globalY, cellSize, createDragRuntimeOptions()),
  });
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
  if (!refs.controlsView) {
    refs.controlsView = createPixiControlsView(refs.controls, {
      onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
      onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
      onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
      onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
      onWave: () => waveButtonAction(refs),
    });
  }

  const summonState = getSummonButtonState(refs.state);
  const upgradeCost = getPowerUpgradeCost(refs.state.powerUpgradeLevel);
  updatePixiControlsView(refs.controlsView, layout, {
    summonLabel: summonState.sub,
    summonDisabled: summonState.disabled || refs.movementLocked,
    mythicReady: getMythicCraftAvailability(refs.state).some((item) => item.canCraft),
    mythicDisabled: isFinished(refs.state) || refs.movementLocked,
    gambleDisabled: isFinished(refs.state) || isBoardFull(refs.state.board) || refs.state.luckStones < 2 || refs.movementLocked,
    upgradeCost,
    upgradeLevel: refs.state.powerUpgradeLevel,
    upgradeDisabled: isFinished(refs.state) || refs.state.resources < upgradeCost || refs.movementLocked,
    wavePhase: refs.wavePhase,
    aliveEnemyCount: refs.activeEnemies.filter((enemy) => enemy.alive).length,
    waveDisabled: isFinished(refs.state) || refs.movementLocked || refs.wavePhase === "combat",
  });
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const { animation } = createFloatingText(refs.effects, value, x, y, color);
  addAnimation(refs, animation);
}

function waveButtonAction(refs: GameRefs) {
  if (refs.wavePhase === "combat") return;
  refs.nextWaveTimer = 0;
  startAutoWave(refs);
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

function submitFinalResultOnce(refs: GameRefs) {
  if (refs.resultSubmitted || (refs.state.status !== "failed" && refs.state.status !== "cleared")) return;
  refs.resultSubmitted = true;

  void submitGameRun(refs.state)
    .then(() => {
      floatText(refs, "기록 저장 완료", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.green);
    })
    .catch(() => {
      floatText(refs, "로그인하면 기록 저장", refs.app.renderer.width / 2, refs.app.renderer.height * 0.3, colors.orange);
    });
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
  clearMenuAndUnitInfo(refs);
  refs.wavePhase = "combat";
  refs.combatTimer = WAVE_COMBAT_SECONDS;
  refs.attackTimer = 0.25;
  refs.state = startWave(refs.state);
  render(refs);
  spawnWaveMonsters(refs, { showBossWarning, invalidateControls });
}

function finishAutoWave(refs: GameRefs, readyImmediately = false) {
  const alive = refs.activeEnemies.filter((enemy) => enemy.alive);
  let lostLives = refs.waveLostLives;
  for (const enemy of alive) {
    lostLives += enemy.damageToLife;
    enemy.alive = false;
    destroyActiveEnemy(enemy);
  }

  const leaked = alive.length + refs.waveLostLives;
  const perfect = lostLives <= 0;
  const baseLuckStoneReward = perfect ? (isBossWave(refs.state) ? 2 : refs.state.currentWave % 3 === 0 ? 1 : 0) : 0;
  const luckStoneReward = getPerfectWaveLuckStoneReward(refs.progressBonuses, baseLuckStoneReward, refs.random);
  const reducedLostLives = applyLeakReduction(refs.progressBonuses, lostLives);
  const nextLives = Math.max(0, refs.state.lives - reducedLostLives);
  const finalWave = refs.state.currentWave >= initialBalance.maxWave;
  const nextStatus = nextLives <= 0 ? "failed" : finalWave ? "cleared" : "playing";
  const nextWave = nextStatus === "playing" ? refs.state.currentWave + 1 : refs.state.currentWave;

  refs.activeEnemies = [];
  refs.lastWaveSummary = { killed: refs.waveKilled, leaked, lostLives: reducedLostLives, reward: refs.waveReward, luckStoneReward, perfect };
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
  refs.resultTimer = readyImmediately ? 0.35 : WAVE_RESULT_SECONDS;
  refs.nextWaveTimer = readyImmediately ? 0 : WAVE_COUNTDOWN_SECONDS;
  render(refs);
  showWaveResult(refs, refs.lastWaveSummary);
  submitFinalResultOnce(refs);
}

function render(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, layout);
  drawTopHud(refs, layout);
  drawBoard(refs, layout);
  drawSelectedUnitInfo(refs);
  drawControls(refs, layout);
}

function tick(refs: GameRefs, deltaMs: number) {
  const deltaSeconds = deltaMs / 1000;
  refs.animations = tickPixiAnimations(refs.animations, deltaMs);

  if (isFinished(refs.state)) return;

  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  if (refs.wavePhase === "countdown") {
    refs.nextWaveTimer -= deltaSeconds;
    if (refs.nextWaveTimer <= 0) startAutoWave(refs);
    else drawTopHud(refs, layout);
    return;
  }

  if (refs.wavePhase === "combat") {
    refs.combatTimer -= deltaSeconds;
    refs.attackTimer -= deltaSeconds;
    updateActiveEnemies(refs, deltaSeconds, { getPathPoint, invalidateControls, floatText });
    if (refs.attackTimer <= 0) {
      refs.attackTimer = isBossWave(refs.state) ? 0.34 : 0.48;
      spawnAttackEffects(refs, { getCellCenter, addAnimation, floatText, invalidateControls, drawTopHud, drawControls });
    }
    drawTopHud(refs, layout);
    drawControls(refs, layout);
    if (refs.combatTimer <= 0) finishAutoWave(refs, false);
    else if (refs.activeEnemies.length > 0 && refs.activeEnemies.every((enemy) => !enemy.alive)) finishAutoWave(refs, true);
    return;
  }

  refs.resultTimer -= deltaSeconds;
  drawTopHud(refs, layout);
  drawControls(refs, layout);
  if (refs.resultTimer <= 0) {
    refs.wavePhase = "countdown";
    drawControls(refs, layout);
    drawTopHud(refs, layout);
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
    info: new Container(),
    effects: new Container(),
    menuLayer: new Container(),
    hudView: null,
    controlsView: null,
    state: createInitialGameState(seed),
    progressBonuses: createPixiProgressBonuses(),
    random: createSeededRandom(seed),
    animations: [],
    lastSummonedIndex: null,
    dragging: null,
    movementLocked: false,
    selectedCellIndex: null,
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
    resultSubmitted: false,
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
      app.destroy({ removeView: true }, { children: true });
      return;
    }

    parent.appendChild(app.canvas);
    app.stage.addChild(stage);
    stage.eventMode = "static";
    stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
    stage.on("pointerdown", (event: any) => {
      const cellIndex = getCellIndexAtPoint(refs, event.global.x, event.global.y);
      const cell = cellIndex === null ? null : refs.state.board[cellIndex];
      if (!cell || cell.units.length === 0) clearMenuAndUnitInfo(refs);
    });
    stage.on("pointermove", (event: any) => moveDragGhost(refs, event.global.x, event.global.y));
    stage.on("pointerup", (event: any) => finishCellDrag(refs, event.global.x, event.global.y, createDragRuntimeOptions()));
    stage.on("pointerupoutside", (event: any) => finishCellDrag(refs, event.global.x, event.global.y, createDragRuntimeOptions()));
    mountPixiGameLayers(stage, {
      world: refs.world,
      board: refs.board,
      hud: refs.hud,
      controls: refs.controls,
      info: refs.info,
      effects: refs.effects,
      menuLayer: refs.menuLayer,
    });
    render(refs);
    app.renderer.on("resize", () => {
      stage.hitArea = new Rectangle(0, 0, app.renderer.width, app.renderer.height);
      clearMenuAndUnitInfo(refs);
      invalidateHud(refs);
      invalidateControls(refs);
      render(refs);
    });
    app.ticker.add((ticker) => tick(refs, ticker.deltaMS));
  }

  void init();

  return {
    cleanup: () => {
      destroyed = true;
      clearMenuAndUnitInfo(refs);
      clearDrag(refs);
      refs.activeEnemies.forEach(destroyActiveEnemy);
      app.destroy({ removeView: true }, { children: true });
    },
  };
}
