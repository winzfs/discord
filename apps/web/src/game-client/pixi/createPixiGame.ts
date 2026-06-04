import { Application, Container, Rectangle } from "pixi.js";
import {
  createInitialGameState,
  createSeededRandom,
  initialBalance,
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
  invalidatePixiHudView,
} from "./pixiHudView";
import {
  invalidatePixiControlsView,
} from "./pixiControlsView";
import { createActiveEnemy, destroyActiveEnemy } from "./pixiEnemyRuntime";
import {
  showBossWarning,
  showWaveResult,
  type PixiWaveFeedbackRuntimeOptions,
} from "./pixiWaveFeedbackRuntime";
import {
  finishAutoWave,
  startAutoWave,
  waveButtonAction,
  type PixiWaveFlowRuntimeOptions,
} from "./pixiWaveFlowRuntime";
import { drawBackground, drawControls, drawTopHud, getSummonButtonState } from "./pixiRenderRuntime";
import { drawBoard } from "./pixiBoardRenderRuntime";
import { updateActiveEnemies } from "./pixiEnemyMovementRuntime";
import { spawnAttackEffects } from "./pixiCombatRuntime";
import {
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
import {
  applyEconomyRewardBonus,
  createPixiProgressBonuses,
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

function createWaveFlowRuntimeOptions(): PixiWaveFlowRuntimeOptions {
  return {
    isFinished,
    isBossWave,
    clearMenuAndUnitInfo,
    render,
    showWaveResult: (refs) => showWaveResult(refs, refs.lastWaveSummary!, createWaveFeedbackRuntimeOptions()),
    submitFinalResultOnce,
    showBossWarning: (refs) => showBossWarning(refs, createWaveFeedbackRuntimeOptions()),
    invalidateControls,
  };
}

function createWaveFeedbackRuntimeOptions(): PixiWaveFeedbackRuntimeOptions {
  return {
    addAnimation,
    floatText,
  };
}

function createControlActionRuntimeOptions(): PixiControlActionRuntimeOptions {
  return {
    clearMenu,
    clearMenuAndUnitInfo,
    getSummonButtonState: (state) => getSummonButtonState(state, isFinished),
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

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const { animation } = createFloatingText(refs.effects, value, x, y, color);
  addAnimation(refs, animation);
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

function render(refs: GameRefs) {
  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  drawBackground(refs, layout);
  drawTopHud(refs, layout);
  drawBoard(refs, layout, createDragRuntimeOptions);
  drawSelectedUnitInfo(refs);
  drawControls(refs, layout, {
    isFinished,
    onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
    onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
    onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
    onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
    onWave: () => waveButtonAction(refs, createWaveFlowRuntimeOptions()),
  });
}

function tick(refs: GameRefs, deltaMs: number) {
  const deltaSeconds = deltaMs / 1000;
  refs.animations = tickPixiAnimations(refs.animations, deltaMs);

  if (isFinished(refs.state)) return;

  const layout = createGameLayout(refs.app.renderer.width, refs.app.renderer.height);
  if (refs.wavePhase === "countdown") {
    refs.nextWaveTimer -= deltaSeconds;
    if (refs.nextWaveTimer <= 0) startAutoWave(refs, createWaveFlowRuntimeOptions());
    else drawTopHud(refs, layout);
    return;
  }

  if (refs.wavePhase === "combat") {
    refs.combatTimer -= deltaSeconds;
    refs.attackTimer -= deltaSeconds;
    updateActiveEnemies(refs, deltaSeconds, { getPathPoint, invalidateControls, floatText });
    if (refs.attackTimer <= 0) {
      refs.attackTimer = isBossWave(refs.state) ? 0.34 : 0.48;
      spawnAttackEffects(refs, {
        getCellCenter,
        addAnimation,
        floatText,
        invalidateControls,
        drawTopHud,
        drawControls: (refs, layout) => drawControls(refs, layout, {
          isFinished,
          onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
          onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
          onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
          onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
          onWave: () => waveButtonAction(refs, createWaveFlowRuntimeOptions()),
        }),
      });
    }
    drawTopHud(refs, layout);
    drawControls(refs, layout, {
    isFinished,
    onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
    onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
    onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
    onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
    onWave: () => waveButtonAction(refs, createWaveFlowRuntimeOptions()),
  });
    if (refs.combatTimer <= 0) finishAutoWave(refs, false, createWaveFlowRuntimeOptions());
    else if (refs.activeEnemies.length > 0 && refs.activeEnemies.every((enemy) => !enemy.alive)) finishAutoWave(refs, true, createWaveFlowRuntimeOptions());
    return;
  }

  refs.resultTimer -= deltaSeconds;
  drawTopHud(refs, layout);
  drawControls(refs, layout, {
    isFinished,
    onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
    onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
    onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
    onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
    onWave: () => waveButtonAction(refs, createWaveFlowRuntimeOptions()),
  });
  if (refs.resultTimer <= 0) {
    refs.wavePhase = "countdown";
    drawControls(refs, layout, {
    isFinished,
    onSummon: () => summonAction(refs, createControlActionRuntimeOptions()),
    onMythic: () => showMythicMenu(refs, createControlActionRuntimeOptions()),
    onGamble: () => gambleAction(refs, createControlActionRuntimeOptions()),
    onUpgrade: () => attackUpgradeAction(refs, createControlActionRuntimeOptions()),
    onWave: () => waveButtonAction(refs, createWaveFlowRuntimeOptions()),
  });
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
