import {
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_WIDTH,
  PAUSE_BUTTON,
  ULTIMATE_BUTTON,
  UPGRADE_CARD_BOUNDS,
} from "./heroStrikeConfig";
import { activateUltimate } from "./heroStrikePlayerRuntime";
import { advanceHeroStrikeStage } from "./heroStrikeStageRuntime";
import { resetHeroStrikeState } from "./heroStrikeState";
import { applyUpgrade } from "./heroStrikeUpgrades";
import type { HeroStrikeState } from "./heroStrikeTypes";

function insideCircle(x: number, y: number, target: { x: number; y: number; radius: number }) {
  return Math.hypot(x - target.x, y - target.y) <= target.radius;
}

function resetPointer(state: HeroStrikeState) {
  state.pointerActive = false;
  state.pointerLastX = null;
  state.pointerLastY = null;
}

function clampTargetX(value: number) {
  return Math.max(25, Math.min(HERO_STRIKE_WIDTH - 25, value));
}

function clampTargetY(value: number) {
  return Math.max(330, Math.min(HERO_STRIKE_HEIGHT - 62, value));
}

export function handleHeroStrikePointer(state: HeroStrikeState, x: number, y: number, pressed: boolean) {
  if (state.phase === "title" || state.phase === "game-over" || state.phase === "victory") {
    resetPointer(state);
    if (pressed) resetHeroStrikeState(state);
    return;
  }
  if (state.phase === "stage-clear") {
    resetPointer(state);
    if (pressed) advanceHeroStrikeStage(state);
    return;
  }
  if (state.phase === "paused") {
    resetPointer(state);
    if (pressed) state.phase = state.previousPhase === "paused" ? "playing" : state.previousPhase;
    return;
  }
  if (state.phase === "level-up") {
    resetPointer(state);
    if (!pressed) return;
    const index = UPGRADE_CARD_BOUNDS.findIndex((bounds) => x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height);
    const choice = state.upgradeChoices[index];
    if (choice) applyUpgrade(state, choice.id);
    return;
  }
  if (pressed && insideCircle(x, y, PAUSE_BUTTON)) {
    resetPointer(state);
    state.previousPhase = state.phase;
    state.phase = "paused";
    return;
  }
  if (pressed && insideCircle(x, y, ULTIMATE_BUTTON)) {
    resetPointer(state);
    activateUltimate(state);
    return;
  }

  if (pressed) {
    state.pointerActive = true;
    state.pointerLastX = x;
    state.pointerLastY = y;
    return;
  }
  if (!state.pointerActive || state.pointerLastX === null || state.pointerLastY === null) return;

  const deltaX = x - state.pointerLastX;
  const deltaY = y - state.pointerLastY;
  state.player.targetX = clampTargetX(state.player.targetX + deltaX);
  state.player.targetY = clampTargetY(state.player.targetY + deltaY);
  state.pointerLastX = x;
  state.pointerLastY = y;
}

export function releaseHeroStrikePointer(state: HeroStrikeState) {
  resetPointer(state);
}