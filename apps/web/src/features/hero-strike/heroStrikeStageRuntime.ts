import { HERO_STRIKE_COLORS, HERO_STRIKE_PLAYER_Y, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import { spawnStageReward } from "./heroStrikePickups";
import { getHeroStrikeStage, isFinalHeroStrikeStage } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function tickHeroStrikeStage(state: HeroStrikeState, dt: number) {
  state.stageElapsed += dt;
}

export function completeHeroStrikeStage(state: HeroStrikeState) {
  const stage = getHeroStrikeStage(state.stageIndex);
  state.bossDefeated = true;
  state.score += stage.clearBonus;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.enemies = [];
  state.flash = 0.65;
  state.shake = 1;

  if (isFinalHeroStrikeStage(state.stageIndex)) {
    state.phase = "victory";
    return;
  }

  state.phase = "stage-clear";
}

export function advanceHeroStrikeStage(state: HeroStrikeState) {
  if (isFinalHeroStrikeStage(state.stageIndex)) return false;

  state.stageIndex += 1;
  state.stageElapsed = 0;
  state.stageBanner = 2.8;
  state.spawnCooldown = 0.55;
  state.bossSpawned = false;
  state.bossDefeated = false;
  state.bossWarning = 0;
  state.bullets = [];
  state.enemies = [];
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
  state.player.shield = Math.min(5, state.player.shield + 1);
  state.player.ultimate = Math.min(state.player.ultimateMax, state.player.ultimate + 25);
  state.player.x = HERO_STRIKE_WIDTH / 2;
  state.player.targetX = HERO_STRIKE_WIDTH / 2;
  state.player.y = HERO_STRIKE_PLAYER_Y;
  state.player.targetY = HERO_STRIKE_PLAYER_Y;
  state.phase = "playing";

  spawnStageReward(state, state.stageIndex);
  const stage = getHeroStrikeStage(state.stageIndex);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 250, `STAGE ${state.stageIndex + 1}`, HERO_STRIKE_COLORS.gold, 22);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 278, stage.name, HERO_STRIKE_COLORS.white, 14);
  return true;
}