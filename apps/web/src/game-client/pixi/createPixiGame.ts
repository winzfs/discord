import { Application, Container, Rectangle } from "pixi.js";
import {
  canMergeStackCell,
  craftMythicHero,
  createInitialGameState,
  createSeededRandom,
  gambleSummon,
  getBoardCapacity,
  getBoardUnitCount,
  getMythicCraftAvailability,
  getPowerUpgradeCost,
  getSummonCost,
  initialBalance,
  isBoardFull,
  mergeStackedCell,
  moveOneHeroToCell,
  sellTopUnitInCell,
  startWave,
  summonHero,
  upgradeAttack,
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
  createUnitGhost as createBoardUnitGhost,
  drawBoardCells,
  type BoardMetrics,
} from "./pixiBoardView";
import { submitGameRun } from "../submitGameRun";
import { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";
import { createFloatingText } from "./pixiFloatingTextView";
import { mountPixiGameLayers } from "./pixiGameLayerOrder";
import { createPixiMythicMenuView } from "./pixiMythicMenuView";
import { createPixiUnitMenuView } from "./pixiUnitMenuView";
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

function createUnitGhost(hero: Pick<BoardHero, "grade" | "heroId">, cell: number, alpha = 0.92) {
  return createBoardUnitGhost(hero, cell, alpha);
}

function beginCellDrag(refs: GameRefs, sourceIndex: number, globalX: number, globalY: number, cell: number) {
  if (isFinished(refs.state) || refs.movementLocked) return;
  const sourceCell = refs.state.board[sourceIndex];
  const movingHero = sourceCell?.units[sourceCell.units.length - 1];
  if (!movingHero) return;

  clearMenu(refs);
  clearUnitSelection(refs);
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
    if (result.reason === "target_full") floatText(refs, "칸이 가득 찼어", refs.app.renderer.width / 2, refs.app.renderer.height * 0.52, colors.red);
    return;
  }

  animateMoveResult(refs, sourceIndex, targetIndex, previousState, result.state, result.action);
}

function showUnitMenu(refs: GameRefs, cellIndex: number) {
  if (refs.movementLocked) return;
  const cell = refs.state.board[cellIndex];
  if (!cell || cell.units.length === 0) return;

  clearMenu(refs);
  refs.selectedCellIndex = cellIndex;
  drawSelectedUnitInfo(refs);

  const menu = createPixiUnitMenuView({
    center: getCellCenter(refs, cellIndex),
    rendererWidth: refs.app.renderer.width,
    canMerge: canMergeStackCell(refs.state, cellIndex),
    onMerge: () => mergeMenuAction(refs, cellIndex),
    onSell: () => sellMenuAction(refs, cellIndex),
  });
  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

function mergeMenuAction(refs: GameRefs, cellIndex: number) {
  clearMenuAndUnitInfo(refs);
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
  clearMenuAndUnitInfo(refs);
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

function drawBoard(refs: GameRefs, layout: GameLayout) {
  const metrics = getBoardMetrics(refs, layout);
  drawBoardCells(refs.board, refs.state.board, metrics, (cellIndex) => canMergeStackCell(refs.state, cellIndex), {
    canDrag: !refs.movementLocked,
    onCellPointerDown: (cellIndex, globalX, globalY, cellSize) => beginCellDrag(refs, cellIndex, globalX, globalY, cellSize),
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
      onSummon: () => summonAction(refs),
      onMythic: () => showMythicMenu(refs),
      onGamble: () => gambleAction(refs),
      onUpgrade: () => attackUpgradeAction(refs),
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

function summonAction(refs: GameRefs) {
  clearMenuAndUnitInfo(refs);
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
  clearMenuAndUnitInfo(refs);
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
  clearMenuAndUnitInfo(refs);
  if (refs.movementLocked) return;
  const result = upgradeAttack(refs.state);
  refs.state = result.state;
  render(refs);
  floatText(refs, result.upgraded ? `공격력 강화 +${refs.state.powerUpgradeLevel}` : `코인 부족 ${result.cost}`, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, result.upgraded ? colors.yellow : colors.red);
}


function showMythicMenu(refs: GameRefs) {
  clearMenu(refs);
  const menu = createPixiMythicMenuView({
    state: refs.state,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    onClose: () => clearMenu(refs),
    onCraft: (recipeId) => mythicCraftAction(refs, recipeId),
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
    stage.on("pointerup", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
    stage.on("pointerupoutside", (event: any) => finishCellDrag(refs, event.global.x, event.global.y));
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
