import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeLobbyBackdrop(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HERO_STRIKE_HEIGHT);
  gradient.addColorStop(0, "#0a2038");
  gradient.addColorStop(0.46, "#061426");
  gradient.addColorStop(1, "#02060f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  const glow = ctx.createRadialGradient(104, 138, 8, 104, 138, 220);
  glow.addColorStop(0, "rgba(105,231,255,.19)");
  glow.addColorStop(0.46, "rgba(59,130,246,.07)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, 360);

  ctx.save();
  ctx.strokeStyle = "rgba(105,231,255,.08)";
  ctx.lineWidth = 1;
  for (let index = 0; index < 6; index += 1) {
    const left = -76 + index * 90;
    ctx.beginPath();
    ctx.moveTo(HERO_STRIKE_WIDTH / 2 + (left - HERO_STRIKE_WIDTH / 2) * 0.3, 188);
    ctx.lineTo(left, HERO_STRIKE_HEIGHT);
    ctx.stroke();
  }
  for (let y = 228; y < HERO_STRIKE_HEIGHT; y += 54) {
    ctx.globalAlpha = 0.04 + (y / HERO_STRIKE_HEIGHT) * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(HERO_STRIKE_WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "rgba(105,231,255,.06)";
  ctx.fillRect(0, 52, HERO_STRIKE_WIDTH, 1);
  ctx.fillRect(0, 238, HERO_STRIKE_WIDTH, 1);

  ctx.strokeStyle = "rgba(105,231,255,.08)";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-12, 38);
  ctx.lineTo(76, 238);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(HERO_STRIKE_WIDTH + 12, 38);
  ctx.lineTo(HERO_STRIKE_WIDTH - 76, 238);
  ctx.stroke();

  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  for (const star of state.stars.slice(0, 24)) {
    ctx.globalAlpha = star.alpha * 0.42;
    ctx.fillRect(star.x, star.y * 0.42, Math.max(0.6, star.size * 0.7), Math.max(0.8, star.size * 1.4));
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,.018)";
  for (let y = 0; y < HERO_STRIKE_HEIGHT; y += 4) ctx.fillRect(0, y, HERO_STRIKE_WIDTH, 1);

  ctx.fillStyle = "rgba(2,6,15,.68)";
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, 54);
  ctx.strokeStyle = "rgba(105,231,255,.16)";
  ctx.strokeRect(0.5, 0.5, HERO_STRIKE_WIDTH - 1, HERO_STRIKE_HEIGHT - 1);
}
