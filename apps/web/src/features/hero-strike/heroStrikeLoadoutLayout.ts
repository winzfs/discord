export type HeroStrikeLoadoutRow = "primary" | "support" | "tactical" | "difficulty";
export type HeroStrikeRect = { x: number; y: number; width: number; height: number };

export const HERO_STRIKE_LOBBY_TABS: readonly HeroStrikeLoadoutRow[] = [
  "primary",
  "support",
  "tactical",
  "difficulty",
] as const;

export const HERO_STRIKE_LOBBY_TAB_BOUNDS: readonly HeroStrikeRect[] = [
  { x: 14, y: 250, width: 92, height: 40 },
  { x: 114, y: 250, width: 92, height: 40 },
  { x: 214, y: 250, width: 92, height: 40 },
  { x: 314, y: 250, width: 92, height: 40 },
] as const;

const OPTION_CARD_BOUNDS: readonly HeroStrikeRect[] = [
  { x: 14, y: 302, width: 124, height: 126 },
  { x: 148, y: 302, width: 124, height: 126 },
  { x: 282, y: 302, width: 124, height: 126 },
] as const;

export const HERO_STRIKE_LOADOUT_CARD_BOUNDS: Record<HeroStrikeLoadoutRow, readonly HeroStrikeRect[]> = {
  primary: OPTION_CARD_BOUNDS,
  support: OPTION_CARD_BOUNDS,
  tactical: OPTION_CARD_BOUNDS,
  difficulty: OPTION_CARD_BOUNDS,
};

export const HERO_STRIKE_LOBBY_SLOT_BOUNDS: readonly HeroStrikeRect[] = [
  { x: 14, y: 450, width: 92, height: 62 },
  { x: 114, y: 450, width: 92, height: 62 },
  { x: 214, y: 450, width: 92, height: 62 },
  { x: 314, y: 450, width: 92, height: 62 },
] as const;

export const HERO_STRIKE_LOBBY_BLUEPRINT_BOUNDS: HeroStrikeRect = {
  x: 14,
  y: 526,
  width: 392,
  height: 92,
};

export const HERO_STRIKE_LOADOUT_BACK_BOUNDS: HeroStrikeRect = { x: 14, y: 14, width: 48, height: 32 };
export const HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS: HeroStrikeRect = { x: 20, y: 660, width: 380, height: 64 };

export function isInsideHeroStrikeRect(x: number, y: number, bounds: HeroStrikeRect) {
  return x >= bounds.x
    && x <= bounds.x + bounds.width
    && y >= bounds.y
    && y <= bounds.y + bounds.height;
}

export function getHeroStrikeLobbyTabIndex(x: number, y: number) {
  return HERO_STRIKE_LOBBY_TAB_BOUNDS.findIndex((bounds) => isInsideHeroStrikeRect(x, y, bounds));
}

export function getHeroStrikeLoadoutCardIndex(row: HeroStrikeLoadoutRow, x: number, y: number) {
  return HERO_STRIKE_LOADOUT_CARD_BOUNDS[row].findIndex((bounds) => isInsideHeroStrikeRect(x, y, bounds));
}
