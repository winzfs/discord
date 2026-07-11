import { HERO_STRIKE_COLORS, HERO_STRIKE_PLAYER_Y, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import { grantResearchData } from "./heroStrikeMetaProgress";
import { resetStageObjective, resolveStageObjective } from "./heroStrikeObjectives";
import { spawnStageReward } from "./heroStrikePickups";
import { applyCombatRankMilestone, createStageProtocolChoices } from "./heroStrikeProtocols";
import { getHeroStrikeStage, isFinalHeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function tickHeroStrikeStage(state: HeroStrikeState, dt: number) {
  state.stageElapsed += dt;
}

export function completeHeroStrikeStage(state: HeroStrikeState) {
  const stage = getHeroStrikeStage(state.stageIndex);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  state.bossDefeated = true;
  state.score += Math.round(stage.clearBonus * difficulty.score);
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.missiles = [];
  state.enemies = [];
  state.flash = 0.65;
  state.shake = 1;
  resolveStageObjective(state);
  grantResearchData(state, 3 + state.stageIndex);

  if (isFinalHeroStrikeStage(state.stageIndex)) {
    state.phase = "victory";
    return;
  }

  state.protocolChoices = createStageProtocolChoices(state);
  state.phase = "stage-clear";
}

export function advanceHeroStrikeStage(state: HeroStrikeState) {
  if (isFinalHeroStrikeStage(state.stageIndex)) return false;

  const clearedStageIndex = state.stageIndex;
  const clearedStageNumber = clearedStageIndex + 1;
  const rankUp = applyCombatRankMilestone(state, clearedStageNumber);

  state.stageIndex += 1;
  state.stageElapsed = 0;
  state.stageBanner = 2.8;
  state.spawnCooldown = 0.55;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.bossWarning = 0;
  state.bossPhaseBanner = 0;
  state.bossPhaseLabel = "";
  state.bullets = [];
  state.missiles = [];
  state.enemies = [];
  state.protocolChoices = [];
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
  state.player.shield = Math.min(5, state.player.shield + 1);
  const ultimateReward = Math.round(25 * state.player.ultimateGainMultiplier);
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + ultimateReward);
  state.player.x = HERO_STRIKE_WIDTH / 2;
  state.player.targetX = HERO_STRIKE_WIDTH / 2;
  state.player.y = HERO_STRIKE_PLAYER_Y;
  state.player.targetY = HERO_STRIKE_PLAYER_Y;
  state.phase = "playing";
  resetStageObjective(state, state.stageIndex);

  spawnStageReward(state, clearedStageIndex);
  const stage = getHeroStrikeStage(state.stageIndex);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 250, `STAGE ${state.stageIndex + 1}`, HERO_STRIKE_COLORS.gold, 22);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 278, stage.name, HERO_STRIKE_COLORS.white, 14);
  if (rankUp) {
    addFloatingText(state, HERO_STRIKE_WIDTH / 2, 312, `COMBAT RANK ${state.combatRank}`, HERO_STRIKE_COLORS.cyan, 17);
  }
  return true;
}
