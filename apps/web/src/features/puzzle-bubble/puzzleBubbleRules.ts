import type { Bubble, PuzzleSpecialKind } from "./puzzleBubbleEngine";
import type { PuzzleHeroKind } from "./puzzleBubbleConfig";

export const STAGE_TARGET_REMOVED = 40;
export const FEVER_COMBO_REQUIRED = 3;
export const FEVER_DURATION_SECONDS = 5;

export function pickSpecialReward(clusterSize: number): PuzzleSpecialKind | undefined {
  if (clusterSize >= 5) return "rainbow";
  if (clusterSize >= 4) return "bomb";
  return undefined;
}

export function pickRainbowKind(placed: Bubble, bubbles: Bubble[], fallback: PuzzleHeroKind) {
  let nearest: Bubble | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const bubble of bubbles) {
    if (bubble.id === placed.id) continue;
    const dr = bubble.row - placed.row;
    const dc = bubble.col - placed.col;
    const distance = Math.abs(dr) + Math.abs(dc);
    if (distance < nearestDistance) {
      nearest = bubble;
      nearestDistance = distance;
    }
  }
  return nearest?.kind ?? fallback;
}

export function calculateShotScore(clusterCount: number, detachedCount: number, combo: number, feverActive: boolean) {
  const base = clusterCount * 100 * Math.max(1, combo) + detachedCount * 180;
  return feverActive ? base * 2 : base;
}
