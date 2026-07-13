import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addFloatingText, addRing } from "./heroStrikeEffects";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import type { HeroStrikeState } from "./heroStrikeTypes";
import type { HeroStrikeMissionDefinition } from "./heroStrikeEncounterTypes";

export type HeroStrikeMissionReward = {
  salvage: number;
  score: number;
};

export function calculateHeroStrikeMissionReward(
  state: HeroStrikeState,
  definition: HeroStrikeMissionDefinition,
): HeroStrikeMissionReward {
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  return {
    salvage: Math.max(1, Math.round(definition.rewardSalvage * difficulty.research)),
    score: Math.max(1, Math.round(definition.rewardScore * difficulty.score)),
  };
}

export function presentHeroStrikeMissionSuccess(
  state: HeroStrikeState,
  definition: HeroStrikeMissionDefinition,
  reward: HeroStrikeMissionReward,
) {
  state.score += reward.score;
  state.flash = Math.max(state.flash, 0.2);
  state.shake = Math.max(state.shake, 0.18);
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
