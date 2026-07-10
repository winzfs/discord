import { useCallback, useEffect, useRef, useState } from "react";
import {
  BUBBLE_RADIUS,
  LOSS_LINE_Y,
  PUZZLE_HEIGHT,
  PUZZLE_WIDTH,
  SHOOTER_Y,
  SHOT_SPEED,
  randomHeroKind,
} from "./puzzleBubbleConfig";
import {
  addPressureRow,
  createInitialBubbles,
  findDetachedBubbles,
  findMatchingCluster,
  getBubbleNeighbors,
  getCellPosition,
  hasShotCollision,
  snapShotToGrid,
  type Bubble,
  type Shot,
} from "./puzzleBubbleEngine";
import { configurePuzzleCanvasResolution } from "./puzzleBubbleCanvasResolution";
import {
  FEVER_COMBO_REQUIRED,
  FEVER_DURATION_SECONDS,
  STAGE_TARGET_REMOVED,
  calculateShotScore,
  pickRainbowKind,
  pickSpecialReward,
} from "./puzzleBubbleRules";
import { preloadPuzzleBubbleImages, renderPuzzleBubble, type RenderState } from "./puzzleBubbleRenderer";

const INITIAL_DROP_COUNT = 6;

function createInitialState(): RenderState {
  return {
    bubbles: createInitialBubbles(),
    falling: [],
    shot: null,
    currentKind: randomHeroKind(),
    nextKind: randomHeroKind(),
    currentSpecial: undefined,
    nextSpecial: undefined,
    aimX: PUZZLE_WIDTH / 2,
    aimY: 250,
    score: 0,
    combo: 0,
    shotsUntilDrop: INITIAL_DROP_COUNT,
    gameOver: false,
    stageCleared: false,
    removedCount: 0,
    targetRemoved: STAGE_TARGET_REMOVED,
    feverRemaining: 0,
    flash: 0,
  };
}

function createFallingBubble(bubble: Bubble): Bubble {
  const position = getCellPosition(bubble.row, bubble.col);
  return { ...bubble, falling: true, x: position.x, y: position.y, vy: -30, alpha: 1 };
}

export function usePuzzleBubbleGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const stateRef = useRef<RenderState>(createInitialState());
  const [, forceRender] = useState(0);

  const reset = useCallback(() => {
    stateRef.current = createInitialState();
    forceRender((value) => value + 1);
  }, []);

  const resolveShot = useCallback((shot: Shot) => {
    const state = stateRef.current;
    let placed = snapShotToGrid(shot, state.bubbles);
    let bubbles = [...state.bubbles, placed];
    let removed: Bubble[] = [];
    let clusterSize = 0;

    if (shot.special === "rainbow") {
      placed = { ...placed, kind: pickRainbowKind(placed, state.bubbles, shot.kind), special: undefined };
      bubbles = [...state.bubbles, placed];
    }

    if (shot.special === "bomb") {
      removed = [placed, ...getBubbleNeighbors(placed, bubbles)];
      clusterSize = removed.length;
    } else {
      const cluster = findMatchingCluster(placed, bubbles);
      clusterSize = cluster.length;
      if (cluster.length >= 3) removed = cluster;
    }

    if (removed.length > 0) {
      const removedIds = new Set(removed.map((bubble) => bubble.id));
      bubbles = bubbles.filter((bubble) => !removedIds.has(bubble.id));
      const detached = findDetachedBubbles(bubbles);
      const detachedIds = new Set(detached.map((bubble) => bubble.id));
      bubbles = bubbles.filter((bubble) => !detachedIds.has(bubble.id));

      state.combo += 1;
      if (state.combo >= FEVER_COMBO_REQUIRED) state.feverRemaining = FEVER_DURATION_SECONDS;
      const feverActive = state.feverRemaining > 0;
      state.score += calculateShotScore(removed.length, detached.length, state.combo, feverActive);
      state.removedCount += removed.length + detached.length;
      state.flash = feverActive ? .34 : .22;
      state.falling.push(...removed.filter((bubble) => bubble.id !== placed.id).map(createFallingBubble));
      state.falling.push(...detached.map(createFallingBubble));
      state.nextSpecial = pickSpecialReward(clusterSize);
    } else {
      state.combo = 0;
      state.shotsUntilDrop -= 1;
      if (state.shotsUntilDrop <= 0) {
        bubbles = addPressureRow(bubbles);
        state.shotsUntilDrop = INITIAL_DROP_COUNT;
      }
    }

    state.bubbles = bubbles;
    state.shot = null;
    state.currentKind = state.nextKind;
    state.currentSpecial = state.nextSpecial;
    state.nextKind = randomHeroKind();
    state.nextSpecial = undefined;
    state.stageCleared = state.removedCount >= state.targetRemoved;
    state.gameOver = !state.stageCleared && bubbles.some((bubble) => getCellPosition(bubble.row, bubble.col).y + BUBBLE_RADIUS >= LOSS_LINE_Y);
    forceRender((value) => value + 1);
  }, []);

  const shoot = useCallback((x: number, y: number) => {
    const state = stateRef.current;
    if (state.gameOver || state.stageCleared) {
      if (y >= 390 && y <= 490) reset();
      return;
    }
    if (state.shot || y >= SHOOTER_Y - 12) return;
    const dx = x - PUZZLE_WIDTH / 2;
    const dy = Math.min(-30, y - SHOOTER_Y);
    const length = Math.hypot(dx, dy) || 1;
    state.shot = {
      kind: state.currentKind,
      special: state.currentSpecial,
      x: PUZZLE_WIDTH / 2,
      y: SHOOTER_Y,
      vx: dx / length * SHOT_SPEED,
      vy: dy / length * SHOT_SPEED,
    };
  }, [reset]);

  const setAim = useCallback((x: number, y: number) => {
    stateRef.current.aimX = x;
    stateRef.current.aimY = Math.min(y, SHOOTER_Y - 28);
  }, []);

  useEffect(() => {
    preloadPuzzleBubbleImages();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const syncResolution = () => configurePuzzleCanvasResolution(canvas, context);
    syncResolution();
    window.addEventListener("resize", syncResolution);

    const tick = (time: number) => {
      const dt = Math.min(.033, Math.max(0, (time - lastTimeRef.current) / 1000 || 0));
      lastTimeRef.current = time;
      const state = stateRef.current;

      if (state.shot && !state.stageCleared) {
        state.shot.x += state.shot.vx * dt;
        state.shot.y += state.shot.vy * dt;
        if (state.shot.x <= BUBBLE_RADIUS + 7 || state.shot.x >= PUZZLE_WIDTH - BUBBLE_RADIUS - 7) {
          state.shot.x = Math.max(BUBBLE_RADIUS + 7, Math.min(PUZZLE_WIDTH - BUBBLE_RADIUS - 7, state.shot.x));
          state.shot.vx *= -1;
        }
        if (hasShotCollision(state.shot, state.bubbles)) resolveShot({ ...state.shot });
      }

      state.falling = state.falling
        .map((bubble) => ({
          ...bubble,
          y: (bubble.y ?? 0) + (bubble.vy ?? 0) * dt,
          vy: (bubble.vy ?? 0) + 980 * dt,
          alpha: Math.max(0, (bubble.alpha ?? 1) - dt * .35),
        }))
        .filter((bubble) => (bubble.y ?? 0) < PUZZLE_HEIGHT + 80 && (bubble.alpha ?? 0) > 0);
      state.feverRemaining = Math.max(0, state.feverRemaining - dt);
      state.flash = Math.max(0, state.flash - dt * 1.8);

      renderPuzzleBubble(context, state);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", syncResolution);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [resolveShot]);

  return { canvasRef, shoot, setAim, reset };
}
