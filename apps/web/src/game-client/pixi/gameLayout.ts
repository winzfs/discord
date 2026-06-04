import { getPixiFieldCoverFrame } from "./pixiFieldFrame";

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

const BOARD_LEFT = 0.252;
const BOARD_TOP = 0.333;
const BOARD_WIDTH = 0.498;
const BOARD_HEIGHT = 0.395;

export function createGameLayout(width: number, height: number): GameLayout {
  const safeTop = 10;
  const bottomY = height - 132;
  const field = getPixiFieldCoverFrame(width, height);
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
