import { getHeroStrikeOperationSummary } from "./heroStrikeEncounterDirector";
import type { HeroStrikeState } from "./heroStrikeTypes";

const spentByState = new WeakMap<HeroStrikeState, number>();

export function resetHeroStrikeSalvage(state: HeroStrikeState) {
  spentByState.set(state, 0);
}

export function getHeroStrikeSalvageBalance(state: HeroStrikeState) {
  const earned = getHeroStrikeOperationSummary(state).salvage;
  return Math.max(0, earned - (spentByState.get(state) ?? 0));
}

export function spendHeroStrikeSalvage(state: HeroStrikeState, amount: number) {
  const cost = Math.max(0, Math.round(amount));
  if (getHeroStrikeSalvageBalance(state) < cost) return false;
  spentByState.set(state, (spentByState.get(state) ?? 0) + cost);
  return true;
}

export function getHeroStrikeSalvageSpent(state: HeroStrikeState) {
  return spentByState.get(state) ?? 0;
}
