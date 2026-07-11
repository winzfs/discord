import { playHeroStrikeSound } from "./heroStrikeAudio";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import type { HeroStrikeBullet, HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function impactStrength(bullet: HeroStrikeBullet) {
  if (bullet.style === "rail-driver") return 1.9;
  if (bullet.style === "scatter-array") return 1.35;
  if (bullet.critical) return 1.4;
  return 1;
}

export function applyEnemyHitFeedback(
  state: HeroStrikeState,
  enemy: HeroStrikeEnemy,
  bullet: HeroStrikeBullet,
  damage: number,
  lethal: boolean,
) {
  const strength = impactStrength(bullet);
  enemy.hitFlash = Math.max(enemy.hitFlash, bullet.style === "rail-driver" ? 0.15 : 0.085);
  enemy.hitPulse = Math.max(enemy.hitPulse, 0.08 + strength * 0.035);
  const velocityLength = Math.max(1, Math.hypot(bullet.vx, bullet.vy));
  const force = (bullet.impactForce ?? 18) * strength;
  enemy.recoilX += bullet.vx / velocityLength * force;
  enemy.recoilY += bullet.vy / velocityLength * force;

  const hitStop = lethal
    ? enemy.elite || enemy.boss ? 0.06 : 0.035
    : bullet.style === "rail-driver" ? 0.03 : bullet.critical ? 0.022 : 0.01;
  state.hitStop = Math.max(state.hitStop, hitStop);

  if (bullet.critical || bullet.style === "rail-driver") {
    addFloatingText(
      state,
      enemy.x + (Math.random() - 0.5) * 18,
      enemy.y - enemy.radius * 0.45,
      `${Math.round(damage)}`,
      bullet.critical ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white,
      bullet.style === "rail-driver" ? 17 : 14,
    );
    playHeroStrikeSound(bullet.critical ? "critical" : "hit", strength);
  } else playHeroStrikeSound("hit", 0.75);
}

export function playEnemyDefeatFeedback(enemy: HeroStrikeEnemy) {
  if (enemy.elite) playHeroStrikeSound("elite-kill", 1.15);
  else if (!enemy.boss) playHeroStrikeSound("kill", 0.8);
}

export function updateEnemyImpactFeedback(enemy: HeroStrikeEnemy, dt: number) {
  enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
  enemy.hitPulse = Math.max(0, enemy.hitPulse - dt * 5.2);
  const decay = Math.pow(0.035, dt);
  enemy.recoilX *= decay;
  enemy.recoilY *= decay;
}
