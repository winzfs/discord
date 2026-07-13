import { playHeroStrikeSound } from "./heroStrikeAudio";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import {
  getHeroStrikeMomentumDamageMultiplier,
  getHeroStrikeMomentumFireRateMultiplier,
  getHeroStrikeMomentumMovementMultiplier,
} from "./heroStrikeMomentum";
import {
  getFlowRushDamageMultiplier,
  getFlowRushDuration,
  getFlowRushFireRateMultiplier,
} from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState } from "./heroStrikeTypes";

function activateFlowRush(state: HeroStrikeState) {
  const player = state.player;
  player.flow = 0;
  player.flowRush = getFlowRushDuration(player.overdriveLevel);
  player.flowDecayDelay = 0;
  state.flowBanner = 2.1;
  state.flowActivations += 1;
  state.flash = Math.max(state.flash, 0.45);
  state.shake = Math.max(state.shake, 0.55);
  player.ultimate = Math.min(player.ultimateMax, player.ultimate + 18);
  addRing(state, player.x, player.y, HERO_STRIKE_COLORS.gold, 28);
  addBurst(state, player.x, player.y, HERO_STRIKE_COLORS.gold, 24, 230, 4);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 238, "PULSE RUSH", HERO_STRIKE_COLORS.gold, 24);
  playHeroStrikeSound("flow-rush");
}

export function addHeroStrikeFlow(state: HeroStrikeState, amount: number) {
  const player = state.player;
  if (state.phase !== "playing" || amount <= 0) return;
  if (player.flowRush > 0) {
    player.flowRush = Math.min(
      getFlowRushDuration(player.overdriveLevel) + 2,
      player.flowRush + amount * 0.012,
    );
    return;
  }

  player.flow = Math.min(player.flowMax, player.flow + amount);
  player.flowDecayDelay = 1.65;
  if (player.flow >= player.flowMax) activateFlowRush(state);
}

export function reduceHeroStrikeFlow(state: HeroStrikeState, amount: number) {
  const player = state.player;
  if (player.flowRush > 0) {
    player.flowRush = Math.max(0, player.flowRush - amount * 0.035);
    return;
  }
  player.flow = Math.max(0, player.flow - amount);
  player.flowDecayDelay = 0.4;
}

export function updateHeroStrikeFlow(state: HeroStrikeState, dt: number) {
  const player = state.player;
  if (player.flowRush > 0) {
    player.flowRush = Math.max(0, player.flowRush - dt);
    return;
  }
  player.flowDecayDelay = Math.max(0, player.flowDecayDelay - dt);
  if (player.flowDecayDelay <= 0 && player.flow > 0) {
    player.flow = Math.max(0, player.flow - dt * 5.5);
  }
}

export function isHeroStrikeFlowRush(state: HeroStrikeState) {
  return state.player.flowRush > 0;
}

export function getHeroStrikeFlowDamageMultiplier(state: HeroStrikeState) {
  const rushMultiplier = isHeroStrikeFlowRush(state)
    ? getFlowRushDamageMultiplier(state.player.overdriveLevel)
    : 1;
  return rushMultiplier * getHeroStrikeMomentumDamageMultiplier(state);
}

export function getHeroStrikeFlowFireRateMultiplier(state: HeroStrikeState) {
  const rushMultiplier = isHeroStrikeFlowRush(state)
    ? getFlowRushFireRateMultiplier(state.player.overdriveLevel)
    : 1;
  return rushMultiplier * getHeroStrikeMomentumFireRateMultiplier(state);
}

export function getHeroStrikeFlowMovementResponse(state: HeroStrikeState, baseResponse: number) {
  const rushMultiplier = isHeroStrikeFlowRush(state) ? 1.28 : 1;
  return baseResponse * rushMultiplier * getHeroStrikeMomentumMovementMultiplier(state);
}
