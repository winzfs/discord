import { PAUSE_BUTTON, ULTIMATE_BUTTON, UPGRADE_CARD_BOUNDS } from "./heroStrikeConfig";
import { activateUltimate } from "./heroStrikePlayerRuntime";
import { resetHeroStrikeState } from "./heroStrikeState";
import { applyUpgrade } from "./heroStrikeUpgrades";
import type { HeroStrikeState } from "./heroStrikeTypes";

function insideCircle(x: number, y: number, target: { x: number; y: number; radius: number }) {
  return Math.hypot(x - target.x, y - target.y) <= target.radius;
}

export function handleHeroStrikePointer(state: HeroStrikeState, x: number, y: number, pressed: boolean) {
  if (state.phase === "title" || state.phase === "game-over" || state.phase === "victory") {
    state.pointerActive = false;
    if (pressed) resetHeroStrikeState(state);
    return;
  }
  if (state.phase === "paused") {
    state.pointerActive = false;
    if (pressed) state.phase = state.previousPhase === "paused" ? "playing" : state.previousPhase;
    return;
  }
  if (state.phase === "level-up") {
    state.pointerActive = false;
    if (!pressed) return;
    const index = UPGRADE_CARD_BOUNDS.findIndex((bounds) => x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height);
    const choice = state.upgradeChoices[index];
    if (choice) applyUpgrade(state, choice.id);
    return;
  }
  if (pressed && insideCircle(x, y, PAUSE_BUTTON)) {
    state.pointerActive = false;
    state.previousPhase = state.phase;
    state.phase = "paused";
    return;
  }
  if (pressed && insideCircle(x, y, ULTIMATE_BUTTON)) {
    state.pointerActive = false;
    activateUltimate(state);
    return;
  }
  if (pressed) state.pointerActive = true;
  if (!state.pointerActive) return;
  state.player.targetX = x;
  state.player.targetY = y;
}

export function releaseHeroStrikePointer(state: HeroStrikeState) {
  state.pointerActive = false;
}
