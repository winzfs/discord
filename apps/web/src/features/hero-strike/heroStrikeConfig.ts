export const HERO_STRIKE_WIDTH = 420;
export const HERO_STRIKE_HEIGHT = 760;
export const HERO_STRIKE_PLAYER_Y = 650;
export const HERO_STRIKE_RUN_SECONDS = 60;
export const HERO_STRIKE_BOSS_Y = 142;
export const HERO_STRIKE_PLAYER_RADIUS = 18;
export const HERO_STRIKE_MAX_DT = 0.033;
export const HERO_STRIKE_HIGH_SCORE_KEY = "hero-strike-high-score-v1";
export const HERO_STRIKE_TRACER_ASSET = "/assets/heroes/tracer.png?v=20260605-tracer1";

export const HERO_STRIKE_COLORS = {
  cyan: "#69e7ff",
  blue: "#3b82f6",
  navy: "#071427",
  orange: "#ff9b3d",
  gold: "#ffd166",
  red: "#ff5f6d",
  green: "#79f29d",
  purple: "#bb86fc",
  white: "#f8fbff",
  muted: "#8da4c5",
} as const;

export const ULTIMATE_BUTTON = { x: 354, y: 680, radius: 43 } as const;
export const PAUSE_BUTTON = { x: 390, y: 30, radius: 21 } as const;

export const UPGRADE_CARD_BOUNDS = [
  { x: 20, y: 405, width: 120, height: 210 },
  { x: 150, y: 405, width: 120, height: 210 },
  { x: 280, y: 405, width: 120, height: 210 },
] as const;
