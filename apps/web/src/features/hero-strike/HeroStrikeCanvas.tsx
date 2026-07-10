import type { PointerEvent } from "react";
import { HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { useHeroStrikeGame } from "./useHeroStrikeGame";

export function HeroStrikeCanvas() {
  const { canvasRef, pointer, release } = useHeroStrikeGame();

  const getPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const samples = event.nativeEvent.getCoalescedEvents?.();
    const latest = samples?.[samples.length - 1] ?? event.nativeEvent;
    return {
      x: (latest.clientX - rect.left) * (HERO_STRIKE_WIDTH / rect.width),
      y: (latest.clientY - rect.top) * (HERO_STRIKE_HEIGHT / rect.height),
    };
  };

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    pointer(point.x, point.y, true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const point = getPoint(event);
    pointer(point.x, point.y, false);
  };

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    release();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <canvas
      ref={canvasRef}
      className="hero-strike-canvas"
      width={HERO_STRIKE_WIDTH}
      height={HERO_STRIKE_HEIGHT}
      aria-label="히어로 스트라이크 세로형 슈팅게임"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
