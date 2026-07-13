import { purchaseHeroStrikeArmoryOption } from "./heroStrikeArmory";
import {
  HERO_STRIKE_ARMORY_CARD_BOUNDS,
  HERO_STRIKE_ARMORY_CONTINUE_BOUNDS,
  isInsideHeroStrikeArmoryRect,
} from "./heroStrikeArmoryLayout";
import { unlockHeroStrikeAudio } from "./heroStrikeAudio";
import { isHeroStrikeBlueprintUnlocked } from "./heroStrikeBlueprints";
import { beginHeroStrikeDrive, releaseHeroStrikeFocus } from "./heroStrikeCombatControl";
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
  getHeroStrikeLobbyTabIndex,
  HERO_STRIKE_LOADOUT_BACK_BOUNDS,
  HERO_STRIKE_LOADOUT_DEPLOY_BOUNDS,
  HERO_STRIKE_LOBBY_TABS,
  isInsideHeroStrikeRect,
  type HeroStrikeLoadoutRow,
} from "./heroStrikeLoadoutLayout";
import { getHeroStrikeLobbyTab, setHeroStrikeLobbyTab } from "./heroStrikeLobbyRuntime";
import { activateBlink, activateUltimate } from "./heroStrikePlayerRuntime";
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

function optionForTab(tab: HeroStrikeLoadoutRow, index: number) {
  if (tab === "primary") return PRIMARY_WEAPON_OPTIONS[index];
  if (tab === "support") return SUPPORT_LOADOUT_OPTIONS[index];
  if (tab === "tactical") return TACTICAL_LOADOUT_OPTIONS[index];
  return DIFFICULTY_OPTIONS[index];
}

function applyLobbyOption(state: HeroStrikeState, tab: HeroStrikeLoadoutRow, index: number) {
  const option = optionForTab(tab, index);
  if (!option || !isHeroStrikeBlueprintUnlocked(state.researchRank, tab, option.id)) return false;

  if (tab === "primary") state.loadout.primary = option.id as HeroStrikeState["loadout"]["primary"];
  else if (tab === "support") state.loadout.support = option.id as HeroStrikeState["loadout"]["support"];
  else if (tab === "tactical") state.loadout.tactical = option.id as HeroStrikeState["loadout"]["tactical"];
  else state.loadout.difficulty = option.id as HeroStrikeState["loadout"]["difficulty"];

  saveHeroStrikeLoadout(state.loadout);
  return true;
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

  const tabIndex = getHeroStrikeLobbyTabIndex(x, y);
  if (tabIndex >= 0) {
    setHeroStrikeLobbyTab(state, HERO_STRIKE_LOBBY_TABS[tabIndex]);
    return;
  }

  const activeTab = getHeroStrikeLobbyTab(state);
  const optionIndex = getHeroStrikeLoadoutCardIndex(activeTab, x, y);
  if (optionIndex >= 0) applyLobbyOption(state, activeTab, optionIndex);
}

function handleArmoryPointer(state: HeroStrikeState, x: number, y: number) {
  const optionIndex = HERO_STRIKE_ARMORY_CARD_BOUNDS.findIndex((bounds) => (
    isInsideHeroStrikeArmoryRect(x, y, bounds)
  ));
  if (optionIndex >= 0) {
    const optionIds = ["repair", "primary-tune", "support-tune"] as const;
    purchaseHeroStrikeArmoryOption(state, optionIds[optionIndex]);
    return;
  }
  if (isInsideHeroStrikeArmoryRect(x, y, HERO_STRIKE_ARMORY_CONTINUE_BOUNDS)) {
    advanceHeroStrikeStage(state);
  }
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
    if (pressed) handleArmoryPointer(state, x, y);
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
    releaseHeroStrikeFocus(state);
    state.previousPhase = state.phase;
    state.phase = "paused";
    return;
  }
  if (pressed && insideCircle(x, y, BLINK_BUTTON)) {
    resetPointer(state);
    releaseHeroStrikeFocus(state);
    activateBlink(state);
    return;
  }
  if (pressed && insideCircle(x, y, ULTIMATE_BUTTON)) {
    resetPointer(state);
    releaseHeroStrikeFocus(state);
    activateUltimate(state);
    return;
  }

  if (pressed) {
    state.pointerActive = true;
    state.pointerLastX = x;
    state.pointerLastY = y;
    beginHeroStrikeDrive(state);
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
  const wasActive = state.pointerActive;
  resetPointer(state);
  if (wasActive && state.phase === "playing") releaseHeroStrikeFocus(state);
}
