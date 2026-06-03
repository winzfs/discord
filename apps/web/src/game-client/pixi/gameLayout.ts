export type GameLayout = {
  width: number;
  height: number;
  topHudY: number;
  mapTop: number;
  mapHeight: number;
  boardX: number;
  boardY: number;
  boardWidth: number;
  boardHeight: number;
  bottomY: number;
};

export function createGameLayout(width: number, height: number): GameLayout {
  const safeTop = 10;
  const bottomY = height - 132;
  const mapTop = 82;
  const mapHeight = Math.max(510, bottomY - mapTop - 8);
  const boardWidth = width - 76;
  const boardHeight = Math.min(370, mapHeight * 0.52);
  const boardX = 38;
  const boardY = mapTop + Math.max(142, mapHeight * 0.28);

  return {
    width,
    height,
    topHudY: safeTop,
    mapTop,
    mapHeight,
    boardX,
    boardY,
    boardWidth,
    boardHeight,
    bottomY,
  };
}
