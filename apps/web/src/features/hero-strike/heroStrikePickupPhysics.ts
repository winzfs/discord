import type { HeroStrikePickup, HeroStrikePlayer } from "./heroStrikeTypes";

const XP_INITIAL_LIFE = 12;
const XP_FORCED_FALL_SECONDS = 0.65;

function damping(value: number, dt: number) {
  return Math.pow(value, dt * 60);
}

export function updateHeroStrikePickupMotion(
  pickup: HeroStrikePickup,
  player: HeroStrikePlayer,
  dt: number,
) {
  const dx = player.x - pickup.x;
  const dy = player.y - pickup.y;
  const distance = Math.hypot(dx, dy) || 1;
  const xpAge = pickup.kind === "xp" ? XP_INITIAL_LIFE - pickup.life : Number.POSITIVE_INFINITY;
  const magnetReady = pickup.kind !== "xp" || xpAge >= XP_FORCED_FALL_SECONDS;
  const insideMagnet = magnetReady && distance <= player.magnetRadius;

  if (insideMagnet) {
    const pull = 300 + (player.magnetRadius - Math.min(player.magnetRadius, distance)) * 6;
    pickup.vx += dx / distance * pull * dt;
    pickup.vy += dy / distance * pull * dt;
  } else if (pickup.kind === "xp") {
    pickup.vy = Math.min(195, Math.max(55, pickup.vy + 260 * dt));
  } else {
    pickup.vy = Math.min(110, pickup.vy + 42 * dt);
  }

  if (pickup.kind === "xp") {
    pickup.vx *= damping(insideMagnet ? 0.987 : 0.97, dt);
    pickup.vy *= damping(insideMagnet ? 0.99 : 0.999, dt);
  } else {
    pickup.vx *= damping(0.92, dt);
    pickup.vy *= damping(0.96, dt);
  }

  pickup.x += pickup.vx * dt;
  pickup.y += pickup.vy * dt;
}
