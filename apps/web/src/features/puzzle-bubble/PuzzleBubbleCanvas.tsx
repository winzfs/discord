import type { PointerEvent } from "react";
import { PUZZLE_HEIGHT, PUZZLE_WIDTH } from "./puzzleBubbleConfig";
import { usePuzzleBubbleGame } from "./usePuzzleBubbleGame";

export function PuzzleBubbleCanvas() {
  const { canvasRef, shoot, setAim } = usePuzzleBubbleGame();

  const getCanvasPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (PUZZLE_WIDTH / rect.width),
      y: (event.clientY - rect.top) * (PUZZLE_HEIGHT / rect.height),
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    setAim(point.x, point.y);
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    setAim(point.x, point.y);
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    shoot(point.x, point.y);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="puzzle-bubble-canvas"
      width={PUZZLE_WIDTH}
      height={PUZZLE_HEIGHT}
      aria-label="오버워치 영웅 버블 퍼즐 게임"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
