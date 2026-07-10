import { useCallback, useEffect, useRef } from "react";
import { preloadHeroStrikeAssets } from "./heroStrikeAssets";
import { configureHeroStrikeCanvas } from "./heroStrikeCanvasResolution";
import { HERO_STRIKE_MAX_DT } from "./heroStrikeConfig";
import { handleHeroStrikePointer } from "./heroStrikeInput";
import { renderHeroStrike } from "./heroStrikeRenderer";
import { tickHeroStrike } from "./heroStrikeRuntime";
import { createInitialHeroStrikeState } from "./heroStrikeState";

export function useHeroStrikeGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef(createInitialHeroStrikeState());
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  const pointer = useCallback((x: number, y: number, pressed: boolean) => {
    handleHeroStrikePointer(stateRef.current, x, y, pressed);
  }, []);

  useEffect(() => {
    preloadHeroStrikeAssets();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const syncResolution = () => configureHeroStrikeCanvas(canvas, context);
    syncResolution();
    window.addEventListener("resize", syncResolution);

    const tick = (time: number) => {
      const dt = Math.min(HERO_STRIKE_MAX_DT, Math.max(0, (time - lastTimeRef.current) / 1000 || 0));
      lastTimeRef.current = time;
      tickHeroStrike(stateRef.current, dt);
      renderHeroStrike(context, stateRef.current);
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);

    const handleVisibility = () => {
      const state = stateRef.current;
      if (document.hidden && state.phase === "playing") {
        state.previousPhase = "playing";
        state.phase = "paused";
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", syncResolution);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { canvasRef, pointer };
}
