import { playHeroStrikeSound } from "./heroStrikeAudio";
import { getHeroStrikeBossBreakPressureMultiplier } from "./heroStrikeBossDirector";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addBurst, addFloatingText, addRing } from "./heroStrikeEffects";
import { addHeroStrikeFlow } from "./heroStrikeFlow";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

export function getBossBreakMax(maxHp: number) {
  return Math.max(420, maxHp * 0.18);
}

export function getBossBreakDamageMultiplier(enemy: HeroStrikeEnemy) {
  return (enemy.breakStun ?? 0) > 0 ? 1.38 : 1;
}

export function applyBossBreakPressure(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  damage: number,
  breakPower = 1,
) {
  if (!enemy.boss || enemy.dead || enemy.hp <= 0 || (enemy.breakStun ?? 0) > 0) return false;
  const maximum = enemy.breakMax ?? getBossBreakMax(enemy.maxHp);
  const hunterScale = (state.protocolLevels["precision-link"] ?? 0) > 0 ? 1.25 : 1;
  const actionScale = getHeroStrikeBossBreakPressureMultiplier(state, enemy);
  enemy.breakMax = maximum;
  enemy.breakGauge = Math.min(
    maximum,
    (enemy.breakGauge ?? 0)
      + damage * Math.max(0.35, breakPower) * hunterScale * actionScale,
  );
  if (enemy.breakGauge < maximum) return false;

  enemy.breakGauge = -maximum * 0.75;
  enemy.breakStun = 2.6;
  enemy.fireCooldown = Math.max(enemy.fireCooldown, 2.6);
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.bossBreakBanner = 2.1;
  state.bossBreaks += 1;
  state.hitStop = Math.max(state.hitStop, 0.095);
  state.flash = Math.max(state.flash, 0.55);
  state.shake = Math.max(state.shake, 1.05);
  addHeroStrikeFlow(state, 24);
  addRing(state, enemy.x, enemy.y, HERO_STRIKE_COLORS.gold, 54);
  addBurst(state, enemy.x, enemy.y, HERO_STRIKE_COLORS.gold, 32, 285, 5);
  addFloatingText(state, HERO_STRIKE_WIDTH / 2, 260, "BOSS BREAK", HERO_STRIKE_COLORS.gold, 25);
  playHeroStrikeSound("boss-break");
  return true;
}

export function updateBossBreakState(enemy: HeroStrikeEnemy, dt: number) {
  if (!enemy.boss) return;
  enemy.breakStun = Math.max(0, (enemy.breakStun ?? 0) - dt);
}
