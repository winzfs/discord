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

const FIELD_ASPECT = 864 / 1536;
const BOARD_LEFT = 0.22;
const BOARD_TOP = 0.33;
const BOARD_WIDTH = 0.56;
const BOARD_HEIGHT = 0.405;

function getFieldFrame(width: number, height: number) {
  const scale = Math.max(width / 864, height / 1536);
  const fieldWidth = 864 * scale;
  const fieldHeight = 1536 * scale;

  return {
    x: (width - fieldWidth) / 2,
    y: (height - fieldHeight) / 2,
    width: fieldWidth,
    height: fieldHeight,
  };
}

export function createGameLayout(width: number, height: number): GameLayout {
  const safeTop = 10;
  const bottomY = height - 132;
  const field = getFieldFrame(width, height);
  const mapTop = Math.max(0, field.y);
  const mapHeight = field.height;

  const boardX = field.x + field.width * BOARD_LEFT;
  const boardY = field.y + field.height * BOARD_TOP;
  const boardWidth = field.width * BOARD_WIDTH;
  const boardHeight = field.height * BOARD_HEIGHT;

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
