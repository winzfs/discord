import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { addFloatingText, addRing } from "./heroStrikeEffects";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

export function getBossPhase(boss: HeroStrikeEnemy) {
  const ratio = Math.max(0, boss.hp / Math.max(1, boss.maxHp));
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}

export function updateBossPhase(state: HeroStrikeState, boss: HeroStrikeEnemy) {
  const nextPhase = getBossPhase(boss);
  const currentPhase = boss.bossPhase ?? 1;
  if (nextPhase <= currentPhase) return false;

  boss.bossPhase = nextPhase;
  boss.fireCooldown = 1.15;
  boss.breakGauge = 0;
  boss.breakStun = 0;
  state.bullets = state.bullets.filter((bullet) => !bullet.enemy);
  state.bossPhaseLabel = `BOSS PHASE ${nextPhase}`;
  state.bossPhaseBanner = 1.9;
  state.flash = Math.max(state.flash, 0.28);
  state.shake = Math.max(state.shake, 0.62);
  addRing(state, boss.x, boss.y, nextPhase === 3 ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.gold, 46);
  addFloatingText(state, boss.x, boss.y + boss.radius + 28, `PHASE ${nextPhase}`, HERO_STRIKE_COLORS.white, 18);
  return true;
}

export function getBossPhaseBulletSpeedMultiplier(boss: HeroStrikeEnemy) {
  const phase = boss.bossPhase ?? 1;
  return phase === 3 ? 1.16 : phase === 2 ? 1.08 : 1;
}

export function getBossPhaseCooldownMultiplier(boss: HeroStrikeEnemy) {
  const phase = boss.bossPhase ?? 1;
  return phase === 3 ? 0.7 : phase === 2 ? 0.84 : 1;
}

export function getBossPhaseMovementMultiplier(boss: HeroStrikeEnemy) {
  const phase = boss.bossPhase ?? 1;
  return phase === 3 ? 1.24 : phase === 2 ? 1.12 : 1;
}
