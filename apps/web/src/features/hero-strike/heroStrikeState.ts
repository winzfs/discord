import {
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_HIGH_SCORE_KEY,
  HERO_STRIKE_PLAYER_RADIUS,
  HERO_STRIKE_PLAYER_Y,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import type { HeroStrikeStar, HeroStrikeState } from "./heroStrikeTypes";

function readHighScore() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(HERO_STRIKE_HIGH_SCORE_KEY));
  return Number.isFinite(value) ? value : 0;
}

function createStars(): HeroStrikeStar[] {
  return Array.from({ length: 42 }, () => ({
    x: Math.random() * HERO_STRIKE_WIDTH,
    y: Math.random() * HERO_STRIKE_HEIGHT,
    speed: 22 + Math.random() * 86,
    size: 0.7 + Math.random() * 1.8,
    alpha: 0.18 + Math.random() * 0.65,
  }));
}

export function createInitialHeroStrikeState(): HeroStrikeState {
  return {
    phase: "title",
    previousPhase: "playing",
    elapsed: 0,
    stageElapsed: 0,
    score: 0,
    highScore: readHighScore(),
    kills: 0,
    nextId: 1,
    player: {
      x: HERO_STRIKE_WIDTH / 2,
      y: HERO_STRIKE_PLAYER_Y,
      targetX: HERO_STRIKE_WIDTH / 2,
      targetY: HERO_STRIKE_PLAYER_Y,
      radius: HERO_STRIKE_PLAYER_RADIUS,
      hp: 4,
      maxHp: 4,
      shield: 1,
      invulnerable: 0,
      fireCooldown: 0,
      fireInterval: 0.18,
      damage: 24,
      bulletSpeed: 760,
      bulletCount: 1,
      spread: 0.12,
      pierce: 0,
      magnetRadius: 180,
      ultimate: 35,
      ultimateMax: 100,
      level: 1,
      xp: 0,
      nextXp: 34,
      combo: 0,
      comboTimer: 0,
      overdrive: 0,
      overdriveLevel: 0,
      homingMissileLevel: 0,
      missileCooldown: 0,
      supportDroneLevel: 0,
      supportDroneTime: 0,
      supportDroneCooldown: 0,
      sideCannonLevel: 0,
      rearGuardLevel: 0,
      explosiveRoundsLevel: 0,
      chainCoreLevel: 0,
      criticalChance: 0,
      criticalMultiplier: 1.75,
      timeWarp: 0,
    },
    bullets: [],
    missiles: [],
    enemies: [],
    pickups: [],
    particles: [],
    texts: [],
    stars: createStars(),
    spawnCooldown: 0.25,
    stageIndex: 0,
    stageBanner: 2.4,
    bossSpawned: false,
    bossDefeated: false,
    bossWarning: 0,
    shake: 0,
    flash: 0,
    upgradeChoices: [],
    upgradeLevels: {},
    pointerActive: false,
    pointerLastX: null,
    pointerLastY: null,
  };
}

export function resetHeroStrikeState(state: HeroStrikeState) {
  const fresh = createInitialHeroStrikeState();
  fresh.phase = "playing";
  fresh.highScore = state.highScore;
  Object.assign(state, fresh);
}