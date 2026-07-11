import { playHeroStrikeSound } from "./heroStrikeAudio";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import type { HeroStrikeState } from "./heroStrikeTypes";

type AgencyRuntime = {
  tempo: number;
  stationaryTime: number;
  artilleryCooldown: number;
  artilleryWarning: number;
  artilleryX: number;
  artilleryY: number;
};

const runtimeByState = new WeakMap<HeroStrikeState, AgencyRuntime>();

function createRuntime(): AgencyRuntime {
  return {
    tempo: 58,
    stationaryTime: 0,
    artilleryCooldown: 3.2,
    artilleryWarning: 0,
    artilleryX: 0,
    artilleryY: 0,
  };
}

export function resetHeroStrikeAgency(state: HeroStrikeState) {
  runtimeByState.set(state, createRuntime());
}

export function getHeroStrikeAgency(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime) {
    runtime = createRuntime();
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function addHeroStrikeTempo(state: HeroStrikeState, amount: number) {
  const runtime = getHeroStrikeAgency(state);
  runtime.tempo = Math.max(0, Math.min(100, runtime.tempo + amount));
  if (amount > 0) runtime.stationaryTime = Math.max(0, runtime.stationaryTime - 0.18);
}

export function reduceHeroStrikeTempo(state: HeroStrikeState, amount: number) {
  addHeroStrikeTempo(state, -Math.abs(amount));
}

export function updateHeroStrikeAgencyMovement(state: HeroStrikeState, movedDistance: number, dt: number) {
  const runtime = getHeroStrikeAgency(state);
  const moving = movedDistance >= 0.42;
  if (moving) {
    runtime.stationaryTime = 0;
    runtime.tempo = Math.min(100, runtime.tempo + movedDistance * 0.42 + dt * 7);
  } else {
    runtime.stationaryTime += dt;
    const decay = runtime.stationaryTime > 0.45 ? 22 : 7;
    runtime.tempo = Math.max(0, runtime.tempo - decay * dt);
  }
}

export function getHeroStrikeTempoDamageMultiplier(state: HeroStrikeState) {
  const tempo = getHeroStrikeAgency(state).tempo / 100;
  return 0.68 + tempo * 0.42;
}

export function getHeroStrikeSupportDamageMultiplier(state: HeroStrikeState) {
  const tempo = getHeroStrikeAgency(state).tempo / 100;
  return 0.25 + tempo * 0.75;
}

export function getHeroStrikeSupportIntervalMultiplier(state: HeroStrikeState) {
  const tempo = getHeroStrikeAgency(state).tempo / 100;
  return 2.5 - tempo * 1.5;
}

export function getHeroStrikeFlowGainMultiplier(state: HeroStrikeState) {
  const tempo = getHeroStrikeAgency(state).tempo / 100;
  return 0.5 + tempo * 0.65;
}

function triggerArtillery(state: HeroStrikeState, runtime: AgencyRuntime) {
  const radius = 46;
  addRing(state, runtime.artilleryX, runtime.artilleryY, HERO_STRIKE_COLORS.red, radius);
  addBurst(state, runtime.artilleryX, runtime.artilleryY, HERO_STRIKE_COLORS.red, 22, 235, 4);
  addFloatingText(state, runtime.artilleryX, runtime.artilleryY - 28, "MOVE!", HERO_STRIKE_COLORS.red, 17);
  state.shake = Math.max(state.shake, 0.72);
  state.bullets.push({
    id: state.nextId++,
    x: runtime.artilleryX,
    y: runtime.artilleryY,
    vx: 0,
    vy: 0,
    radius,
    damage: 1,
    pierce: 0,
    enemy: true,
    life: 0.12,
    color: HERO_STRIKE_COLORS.red,
    variant: "heavy",
  });
  playHeroStrikeSound("player-hit", 0.72);
  runtime.artilleryWarning = 0;
  runtime.stationaryTime = 0;
}

export function updateHeroStrikeArtillery(state: HeroStrikeState, dt: number) {
  const runtime = getHeroStrikeAgency(state);
  runtime.artilleryCooldown = Math.max(0, runtime.artilleryCooldown - dt);

  if (runtime.artilleryWarning > 0) {
    runtime.artilleryWarning -= dt;
    if (runtime.artilleryWarning <= 0) triggerArtillery(state, runtime);
    return;
  }

  if (runtime.artilleryCooldown > 0 || runtime.stationaryTime < 1.75 || state.bossWarning > 0) return;
  runtime.artilleryX = state.player.x;
  runtime.artilleryY = state.player.y;
  runtime.artilleryWarning = 0.95;
  runtime.artilleryCooldown = 5.4;
  addFloatingText(state, runtime.artilleryX, runtime.artilleryY - 38, "TARGET LOCK", HERO_STRIKE_COLORS.red, 12);
}
