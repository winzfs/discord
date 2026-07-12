export type HeroStrikeVisualQuality = "full" | "reduced";

const TARGET_FRAME_TIME = 1 / 60;
const PRESSURE_FRAME_TIME = 0.023;
const RECOVERY_FRAME_TIME = 0.018;
const PRESSURE_DURATION = 0.9;
const RECOVERY_DURATION = 4;

function prefersReducedQuality() {
  if (typeof navigator === "undefined") return false;
  const device = navigator as Navigator & { deviceMemory?: number };
  const lowMemory = (device.deviceMemory ?? 8) <= 4;
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return lowMemory || lowCpu;
}

let quality: HeroStrikeVisualQuality = prefersReducedQuality() ? "reduced" : "full";
let smoothedFrameTime = TARGET_FRAME_TIME;
let pressureTime = 0;
let recoveryTime = 0;

export function recordHeroStrikeFrame(frameTime: number) {
  const clamped = Math.min(0.05, Math.max(0.001, frameTime || TARGET_FRAME_TIME));
  smoothedFrameTime += (clamped - smoothedFrameTime) * 0.08;

  if (smoothedFrameTime >= PRESSURE_FRAME_TIME) {
    pressureTime += clamped;
    recoveryTime = 0;
  } else if (smoothedFrameTime <= RECOVERY_FRAME_TIME) {
    recoveryTime += clamped;
    pressureTime = Math.max(0, pressureTime - clamped * 0.5);
  } else {
    pressureTime = Math.max(0, pressureTime - clamped * 0.25);
    recoveryTime = 0;
  }

  if (quality === "full" && pressureTime >= PRESSURE_DURATION) {
    quality = "reduced";
    pressureTime = 0;
    recoveryTime = 0;
    return true;
  }
  if (quality === "reduced" && recoveryTime >= RECOVERY_DURATION && !prefersReducedQuality()) {
    quality = "full";
    pressureTime = 0;
    recoveryTime = 0;
    return true;
  }
  return false;
}

export function getHeroStrikeVisualQuality() {
  return quality;
}

export function isHeroStrikeReducedEffects() {
  return quality === "reduced";
}

export function getHeroStrikeRenderScaleLimit() {
  return quality === "reduced" ? 1 : 1.25;
}

export function getHeroStrikeEffectStride() {
  return quality === "reduced" ? 2 : 1;
}
