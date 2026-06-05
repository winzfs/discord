import type { Application, Container } from "pixi.js";
import type { BoardHero, GameState } from "@discord-random-defense/game";
import type { PixiHudView } from "./pixiHudView";
import type { PixiControlsView } from "./pixiControlsView";
import type { EnemyView } from "./pixiEnemyView";
import type { PixiAnimation } from "./animation/animationManager";
import type { PixiProgressBonuses } from "./pixiProgressBonuses";

export type DragState = {
  sourceIndex: number;
  startX: number;
  startY: number;
  ghost: Container;
  isMoving: boolean;
};

export type WavePhase = "countdown" | "combat" | "result";

export type HeroSpriteAttackState = {
  direction: "left" | "right";
  until: number;
};

export type ZaryaBeamChargeState = {
  targetId: number;
  charge: number;
  lastAttackAt: number;
};

export type MythicUltimateChargeState = {
  charge: number;
  lastUltimateAt: number;
};

export type ActiveEnemy = {
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

export type WaveSummary = {
  killed: number;
  leaked: number;
  lostLives: number;
  reward: number;
  luckStoneReward: number;
  perfect: boolean;
};

export type GameRefs = {
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
  progressBonuses: PixiProgressBonuses;
  random: ReturnType<typeof import("@discord-random-defense/game").createSeededRandom>;
  animations: PixiAnimation[];
  lastSummonedIndex: number | null;
  dragging: DragState | null;
  movementLocked: boolean;
  selectedCellIndex: number | null;
  rangePreview: Container | null;
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
  isTestMode: boolean;
  testEnemyHpMultiplier: number;
  heroSpriteAttacks: Record<string, HeroSpriteAttackState>;
  zaryaBeamCharges: Record<string, ZaryaBeamChargeState>;
  mythicUltimateCharges: Record<string, MythicUltimateChargeState>;
};

export const WAVE_COUNTDOWN_SECONDS = 8;
export const WAVE_COMBAT_SECONDS = 14;
export const WAVE_RESULT_SECONDS = 1.4;
export const MAX_ATTACKERS_PER_TICK = 10;
