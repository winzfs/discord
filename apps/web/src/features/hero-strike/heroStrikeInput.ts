import { unlockHeroStrikeAudio } from "./heroStrikeAudio";
import {
  BLINK_BUTTON,
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_WIDTH,
  PAUSE_BUTTON,
  ULTIMATE_BUTTON,
  UPGRADE_CARD_BOUNDS,
  UPGRADE_REROLL_BOUNDS,
} from "./heroStrikeConfig";
import {
  DIFFICULTY_OPTIONS,
  PRIMARY_WEAPON_OPTIONS,
  saveHeroStrikeLoadout,
  SUPPORT_LOADOUT_OPTIONS,
  TACTICAL_LOADOUT_OPTIONS,
} from "./heroStrikeLoadout";
import {
  getHeroStrikeLoadoutCardIndex,
  HERO_STRIKE_LOADOUT_BACK_BOUNDS,
  HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS,
  isInsideHeroStrikeRect,
} from "./heroStrikeLoadoutLayout";
import { activateBlink, activateUltimate } from "./heroStrikePlayerRuntime";
import { applyStageProtocol } from "./heroStrikeProtocols";
import { advanceHeroStrikeStage } from "./heroStrikeStageRuntime";
import { openHeroStrikeLoadout, resetHeroStrikeState } from "./heroStrikeState";
import { applyUpgrade, rerollUpgradeChoices } from "./heroStrikeUpgrades";
import type { HeroStrikeState } from "./heroStrikeTypes";

function insideCircle(x: number, y: number, target: { x: number; y: number; radius: number }) {
  return Math.hypot(x - target.x, y - target.y) <= target.radius;
}

function insideRect(x: number, y: number, target: { x: number; y: number; width: number; height: number }) {
  return x >= target.x && x <= target.x + target.width && y >= target.y && y <= target.y + target.height;
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

function selectedCardIndex(x: number, y: number) {
  return UPGRADE_CARD_BOUNDS.findIndex(
    (bounds) => x >= bounds.x
      && x <= bounds.x + bounds.width
      && y >= bounds.y
      && y <= bounds.y + bounds.height,
  );
}

function handleLoadoutPointer(state: HeroStrikeState, x: number, y: number) {
  if (isInsideHeroStrikeRect(x, y, HERO_STRIKE_LOADOUT_BACK_BOUNDS)) {
    state.phase = "title";
    return;
  }
  if (isInsideHeroStrikeRect(x, y, HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS)) {
    resetHeroStrikeState(state);
    return;
  }

  const primary = PRIMARY_WEAPON_OPTIONS[getHeroStrikeLoadoutCardIndex("primary", x, y)];
  const support = SUPPORT_LOADOUT_OPTIONS[getHeroStrikeLoadoutCardIndex("support", x, y)];
  const tactical = TACTICAL_LOADOUT_OPTIONS[getHeroStrikeLoadoutCardIndex("tactical", x, y)];
  const difficulty = DIFFICULTY_OPTIONS[getHeroStrikeLoadoutCardIndex("difficulty", x, y)];
  if (primary) state.loadout.primary = primary.id;
  else if (support) state.loadout.support = support.id;
  else if (tactical) state.loadout.tactical = tactical.id;
  else if (difficulty) state.loadout.difficulty = difficulty.id;
  else return;
  saveHeroStrikeLoadout(state.loadout);
}

export function handleHeroStrikePointer(state: HeroStrikeState, x: number, y: number, pressed: boolean) {
  if (pressed) unlockHeroStrikeAudio();
  if (state.phase === "title") {
    resetPointer(state);
    if (pressed) openHeroStrikeLoadout(state);
    return;
  }
  if (state.phase === "game-over" || state.phase === "victory") {
    resetPointer(state);
    if (pressed) openHeroStrikeLoadout(state);
    return;
  }
  if (state.phase === "loadout") {
    resetPointer(state);
    if (pressed) handleLoadoutPointer(state, x, y);
    return;
  }
  if (state.phase === "stage-clear") {
    resetPointer(state);
    if (!pressed) return;
    const choice = state.protocolChoices[selectedCardIndex(x, y)];
    if (!choice) return;
    applyStageProtocol(state, choice.id);
    advanceHeroStrikeStage(state);
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
    if (insideRect(x, y, UPGRADE_REROLL_BOUNDS)) {
      rerollUpgradeChoices(state);
      return;
    }
    const choice = state.upgradeChoices[selectedCardIndex(x, y)];
    if (choice) applyUpgrade(state, choice.id);
    return;
  }
  if (pressed && insideCircle(x, y, PAUSE_BUTTON)) {
    resetPointer(state);
    state.previousPhase = state.phase;
    state.phase = "paused";
    return;
  }
  if (pressed && insideCircle(x, y, BLINK_BUTTON)) {
    resetPointer(state);
    activateBlink(state);
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
