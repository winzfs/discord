export const HERO_STRIKE_ARMORY_CARD_BOUNDS = [
  { x: 22, y: 420, width: 118, height: 158 },
  { x: 151, y: 420, width: 118, height: 158 },
  { x: 280, y: 420, width: 118, height: 158 },
] as const;

export const HERO_STRIKE_ARMORY_CONTINUE_BOUNDS = {
  x: 92,
  y: 624,
  width: 236,
  height: 58,
} as const;

export function isInsideHeroStrikeArmoryRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number },
) {
  return x >= rect.x
    && x <= rect.x + rect.width
    && y >= rect.y
    && y <= rect.y + rect.height;
}
