type GameColorName =
  | "sky"
  | "forestDark"
  | "forest"
  | "grass"
  | "grassLight"
  | "field"
  | "fieldLight"
  | "dirt"
  | "dirtDark"
  | "wood"
  | "panel"
  | "panelDark"
  | "white"
  | "black"
  | "red"
  | "blue"
  | "yellow"
  | "orange"
  | "green"
  | "purple";

export const colors: Record<GameColorName, number> = {
  sky: 0x7bbf43,
  forestDark: 0x3f7d2c,
  forest: 0x5f9f38,
  grass: 0x6fbf45,
  grassLight: 0x87d957,
  field: 0x5dae36,
  fieldLight: 0x72c84a,
  dirt: 0xe7c46b,
  dirtDark: 0xae7d38,
  wood: 0x6e4a2f,
  panel: 0x604a3d,
  panelDark: 0x3f302a,
  white: 0xffffff,
  black: 0x1c1a16,
  red: 0xd94b4b,
  blue: 0x2f7fd5,
  yellow: 0xffd84a,
  orange: 0xff9f1c,
  green: 0x45b85f,
  purple: 0x9b5de5,
};

export function gradeColor(grade?: string): number {
  if (grade === "mythic") return colors.orange;
  if (grade === "legendary") return colors.yellow;
  if (grade === "epic") return colors.purple;
  if (grade === "rare") return colors.blue;
  return colors.white;
}
