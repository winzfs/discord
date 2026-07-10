import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import { spawnStageReward } from "./heroStrikePickups";
import { getHeroStrikeStage, getHeroStrikeStageIndex } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function updateHeroStrikeStage(state: HeroStrikeState) {
  const nextStageIndex = getHeroStrikeStageIndex(state.elapsed);
  if (nextStageIndex === state.stageIndex) return;

  state.stageIndex = nextStageIndex;
  state.stageBanner = 2.6;
  state.flash = Math.max(state.flash, 0.2);
  state.score += 750 * nextStageIndex;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  spawnStageReward(state, nextStageIndex);

  const stage = getHeroStrikeStage(nextStageIndex);
  addFloatingText(state, 210, 250, `STAGE ${nextStageIndex + 1}`, HERO_STRIKE_COLORS.gold, 22);
  addFloatingText(state, 210, 278, stage.name, HERO_STRIKE_COLORS.white, 14);
}
