export type HeroStrikeLoadoutRow = "primary" | "support" | "tactical" | "difficulty";
export type HeroStrikeRect = { x: number; y: number; width: number; height: number };

const makeRow = (y: number): readonly HeroStrikeRect[] => [
  { x: 15, y, width: 120, height: 82 },
  { x: 150, y, width: 120, height: 82 },
  { x: 285, y, width: 120, height: 82 },
];

export const HERO_STRIKE_LOADOUT_CARD_BOUNDS: Record<HeroStrikeLoadoutRow, readonly HeroStrikeRect[]> = {
  primary: makeRow(142),
  support: makeRow(266),
  tactical: makeRow(390),
  difficulty: makeRow(514),
};

export const HERO_STRIKE_LOADOUT_BACK_BOUNDS: HeroStrikeRect = { x: 16, y: 18, width: 58, height: 30 };
export const HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS: HeroStrikeRect = { x: 82, y: 665, width: 256, height: 58 };

export function isInsideHeroStrikeRect(x: number, y: number, bounds: HeroStrikeRect) {
  return x >= bounds.x
    && x <= bounds.x + bounds.width
    && y >= bounds.y
    && y <= bounds.y + bounds.height;
}

export function getHeroStrikeLoadoutCardIndex(row: HeroStrikeLoadoutRow, x: number, y: number) {
  return HERO_STRIKE_LOADOUT_CARD_BOUNDS[row].findIndex((bounds) => isInsideHeroStrikeRect(x, y, bounds));
}
