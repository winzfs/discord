import { getRunBoostById, getRunBoostCost } from "../data/runBoosts";
import type { GameState } from "../types/gameState";
import type { RunBoostId } from "../types/runBoost";

export type RunChoiceResult = {
  state: GameState;
  applied: boolean;
  cost: number;
  reason?: "unknown" | "max_level" | "not_enough_resources";
};

export function applyRunChoice(state: GameState, boostId: RunBoostId): RunChoiceResult {
  const boost = getRunBoostById(boostId);
  if (!boost) return { state, applied: false, cost: 0, reason: "unknown" };

  const currentLevel = state.runBoosts?.[boostId] ?? 0;
  const cost = getRunBoostCost(boostId, currentLevel);

  if (currentLevel >= boost.maxLevel) return { state, applied: false, cost, reason: "max_level" };
  if (state.resources < cost) return { state, applied: false, cost, reason: "not_enough_resources" };

  return {
    state: {
      ...state,
      resources: state.resources - cost,
      runBoosts: {
        ...state.runBoosts,
        [boostId]: currentLevel + 1,
      },
    },
    applied: true,
    cost,
  };
}

export function getRunChoiceLevel(state: GameState, boostId: RunBoostId): number {
  return state.runBoosts?.[boostId] ?? 0;
}
