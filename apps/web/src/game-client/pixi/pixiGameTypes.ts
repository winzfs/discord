import type { Application, Container, Graphics } from "pixi.js";
import type { BoardHero, GameState, HeroDefinition } from "@discord-random-defense/game";
import type { PixiHudView } from "./pixiHudView";
import type { PixiControlsView } from "./pixiControlsView";
import type { EnemyView } from "./pixiEnemyView";
import type { PixiAnimation } from "./animation/animationManager";
import type { PixiProgressBonuses } from "./pixiProgressBonuses";
import type { PixiHeroLevelMap } from "./pixiLobbyHeroPool";

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
  idleUntil: number;
};

export type HeroSpriteOffsetState = {
  x: number;
  y: number;
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

export type GameOverReason = {
  type: "enemy_limit";
  enemyCount: number;
  enemyLimit: number;
  wave: number;
} | null;

export type PixiControlZone = {
  id: number;
  x: number;
  y: number;
  radius: number;
  until: number;
  slowMultiplier: number;
  tintColor: number;
  root: Graphics;
};

export type PixiTestControlsView = {
  root: Container;
  lastKey: string;
  collapsed: boolean;
  scrollRow: number;
  scaleHeroId: string | null;
  scaleSaveStatus: "idle" | "saving" | "saved" | "error";
  scaleSaveMessage: string;
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
  exitQueued?: boolean;
  leaked?: boolean;
  boss: boolean;
  view: EnemyView;
  controlUntil?: number;
  controlX?: number;
  controlY?: number;
  sleepUntil?: number;
  controlSlowUntil?: number;
  controlSlowMultiplier?: number;
  controlTintUntil?: number;
  controlTintColor?: number;
};

export type WaveSummary = {
  killed: number;
  leaked: number;
  lostLives: number;
  reward: number;
  interestReward: number;
  interestBaseCoins: number;
  interestRate: number;
  interestCapped: boolean;
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
  testControlsView?: PixiTestControlsView | null;
  state: GameState;
  progressBonuses: PixiProgressBonuses;
  heroPool: HeroDefinition[];
  heroLevels: PixiHeroLevelMap;
  random: ReturnType<typeof import("@discord-random-defense/game").createSeededRandom>;
  runStartedAt?: number;
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
  heroAttackCooldowns: Record<string, number>;
  activeEnemies: ActiveEnemy[];
  controlZones: PixiControlZone[];
  nextControlZoneId: number;
  nextEnemyId: number;
  nextEnemyLeakAt: number;
  waveKilled: number;
  waveReward: number;
  waveLostLives: number;
  lastWaveSummary: WaveSummary | null;
  gameOverReason: GameOverReason;
  resultSubmitted: boolean;
  lobbyRewardGranted: boolean;
  isTestMode: boolean;
  testEnemyHpMultiplier: number;
  heroSpriteAttacks: Record<string, HeroSpriteAttackState>;
  heroSpriteOffsets: Record<string, HeroSpriteOffsetState>;
  zaryaBeamCharges: Record<string, ZaryaBeamChargeState>;
  mythicUltimateCharges?: Record<string, MythicUltimateChargeState>;
  kitsuneRushUntil?: number;
};

export const WAVE_COUNTDOWN_SECONDS = 8;
export const WAVE_COMBAT_SECONDS = 14;
export const WAVE_RESULT_SECONDS = 1.4;
export const MAX_ATTACKERS_PER_TICK = 10;
