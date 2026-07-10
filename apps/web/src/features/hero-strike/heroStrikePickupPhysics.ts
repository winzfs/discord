import type { HeroStrikePickup, HeroStrikePlayer } from "./heroStrikeTypes";

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
  const insideMagnet = distance <= player.magnetRadius;

  if (insideMagnet) {
    const pull = 260 + (player.magnetRadius - Math.min(player.magnetRadius, distance)) * 5.5;
    pickup.vx += dx / distance * pull * dt;
    pickup.vy += dy / distance * pull * dt;
  } else if (pickup.kind === "xp") {
    pickup.vy = Math.min(145, pickup.vy + 165 * dt);
  } else {
    pickup.vy = Math.min(110, pickup.vy + 42 * dt);
  }

  if (pickup.kind === "xp") {
    pickup.vx *= damping(0.985, dt);
    pickup.vy *= damping(insideMagnet ? 0.988 : 0.997, dt);
  } else {
    pickup.vx *= damping(0.92, dt);
    pickup.vy *= damping(0.96, dt);
  }

  pickup.x += pickup.vx * dt;
  pickup.y += pickup.vy * dt;
}