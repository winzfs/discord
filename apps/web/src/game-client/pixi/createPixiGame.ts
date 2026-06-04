import { Application, Container, Graphics, Rectangle } from "pixi.js";
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
import {
  createEnemyView,
  destroyEnemyView,
  updateEnemyViewHp,
  updateEnemyViewPosition,
  type EnemyView,
} from "./pixiEnemyView";
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
import { formatMythicRecipeText } from "./pixiMythicRecipeText";
import { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";
import { getPixiPathPoint } from "./pixiPathRuntime";
import { drawPixiBackgroundView } from "./pixiBackgroundView";
import { getPixiBoardMetrics, getPixiCellCenter, getPixiCellIndexAtPoint } from "./pixiBoardGeometry";

export type PixiGameHandle = { cleanup: () => void };

type Animation = PixiAnimation;

type DragState = {
  sourceIndex: number;
  startX: number;
  startY: number;
  ghost: Container;
  isMoving: boolean;
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
  view: EnemyView;
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
  info: Container;
  effects: Container;
  menuLayer: Container;
  hudView: PixiHudView | null;
  controlsView: PixiControlsView | null;
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
  resultSubmitted: boolean;
};

const WAVE_COUNTDOWN_SECONDS = 8;
const WAVE_COMBAT_SECONDS = 14;
const WAVE_RESULT_SECONDS = 1.4;
const MAX_ATTACKERS_PER_TICK = 10;

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

function addAnimation(refs: GameRefs, animation: Omit<Animation, "age">) {
  addPixiAnimation(refs.animations, animation);
}

function clearMenu(refs: GameRefs) {
  refs.menu?.destroy({ children: true });
  refs.menu = null;
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
  return getPixiBoardMetrics(layout, refs.state.boardSize);
