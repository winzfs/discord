import { getPowerUpgradeCost } from "../data/balance";
import type { GameState } from "../types/gameState";

export type AttackUpgradeResult = {
  state: GameState;
  upgraded: boolean;
  cost: number;
  reason?: "not_enough_resources" | "game_finished";
};

export function upgradeAttack(state: GameState): AttackUpgradeResult {
  const cost = getPowerUpgradeCost(state.powerUpgradeLevel);

  if (state.status === "failed" || state.status === "cleared") {
    return { state, upgraded: false, cost, reason: "game_finished" };
  }

  if (state.resources < cost) {
    return { state, upgraded: false, cost, reason: "not_enough_resources" };
  }

  return {
    state: {
      ...state,
      resources: state.resources - cost,
      powerUpgradeLevel: state.powerUpgradeLevel + 1,
    },
    upgraded: true,
    cost,
  };
}
