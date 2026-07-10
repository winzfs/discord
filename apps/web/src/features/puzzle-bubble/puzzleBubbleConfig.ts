export const PUZZLE_WIDTH = 420;
export const PUZZLE_HEIGHT = 760;
export const BUBBLE_RADIUS = 22;
export const GRID_COLUMNS = 9;
export const GRID_TOP = 104;
export const SHOOTER_Y = 686;
export const LOSS_LINE_Y = 612;
export const SHOT_SPEED = 720;

export const HERO_KINDS = ["tracer", "kiriko", "dva", "illari", "genji"] as const;
export type PuzzleHeroKind = (typeof HERO_KINDS)[number];

export const HERO_ASSETS: Record<PuzzleHeroKind, string> = {
  tracer: "/assets/heroes/tracer.png?v=20260605-tracer1",
  kiriko: "/assets/heroes/kiriko.png?v=20260605-kiriko1",
  dva: "/assets/heroes/d.va.png?v=20260605-dva1",
  illari: "/assets/heroes/illari.png?v=20260606-illari1",
  genji: "/assets/heroes/genji.png?v=20260606-genji1",
};

export const HERO_COLORS: Record<PuzzleHeroKind, string> = {
  tracer: "#ff9e35",
  kiriko: "#ff5d8f",
  dva: "#61d7ff",
  illari: "#ffd45e",
  genji: "#72f08a",
};

export function randomHeroKind(): PuzzleHeroKind {
  return HERO_KINDS[Math.floor(Math.random() * HERO_KINDS.length)];
}
