import { getHeroStrikeCombatContract } from "./heroStrikeCombatContract";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addFloatingText, addRing } from "./heroStrikeEffects";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import type { HeroStrikeMissionDefinition } from "./heroStrikeEncounterTypes";
import type { HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeMissionReward = {
  salvage: number;
  score: number;
  contractBonus: boolean;
};

export function calculateHeroStrikeMissionReward(
  state: HeroStrikeState,
  definition: HeroStrikeMissionDefinition,
): HeroStrikeMissionReward {
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const contract = getHeroStrikeCombatContract(state);
  const multiplier = contract.rewardMultiplier;
  return {
    salvage: Math.max(1, Math.round(definition.rewardSalvage * difficulty.research * multiplier)),
    score: Math.max(1, Math.round(definition.rewardScore * difficulty.score * multiplier)),
    contractBonus: multiplier > 1,
  };
}

export function presentHeroStrikeMissionSuccess(
  state: HeroStrikeState,
  definition: HeroStrikeMissionDefinition,
  reward: HeroStrikeMissionReward,
) {
  const contract = getHeroStrikeCombatContract(state);
  state.score += reward.score;
  state.flash = Math.max(state.flash, reward.contractBonus ? 0.28 : 0.2);
  state.shake = Math.max(state.shake, reward.contractBonus ? 0.28 : 0.18);
  addRing(state, state.player.x, state.player.y, HERO_STRIKE_COLORS.green, 24);
  addFloatingText(
    state,
    HERO_STRIKE_WIDTH / 2,
    204,
    `${definition.label} COMPLETE`,
    HERO_STRIKE_COLORS.green,
    18,
  );
  addFloatingText(
    state,
    HERO_STRIKE_WIDTH / 2,
    230,
    `SALVAGE +${reward.salvage}`,
    HERO_STRIKE_COLORS.gold,
    13,
  );
  if (reward.contractBonus) {
    addFloatingText(
      state,
      HERO_STRIKE_WIDTH / 2,
      256,
      `${contract.label} CONTRACT CLEARED`,
      contract.accent,
      12,
    );
  }
}

export function presentHeroStrikeMissionFailure(
  state: HeroStrikeState,
  definition: HeroStrikeMissionDefinition,
) {
  addFloatingText(
    state,
    HERO_STRIKE_WIDTH / 2,
    210,
    `${definition.label} FAILED`,
    HERO_STRIKE_COLORS.red,
    17,
  );
  state.flash = Math.max(state.flash, 0.08);
}
