import { HERO_STRIKE_COLORS, HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeBackdrop(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const overdrive = state.player.overdrive > 0;
  const gradient = ctx.createLinearGradient(0, 0, 0, HERO_STRIKE_HEIGHT);
  gradient.addColorStop(0, overdrive ? "#231a3f" : "#0b2945");
  gradient.addColorStop(0.55, overdrive ? "#101c38" : "#071a32");
  gradient.addColorStop(1, "#040912");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  const glow = ctx.createRadialGradient(HERO_STRIKE_WIDTH / 2, 270, 20, HERO_STRIKE_WIDTH / 2, 300, 360);
  glow.addColorStop(0, overdrive ? "rgba(255, 166, 69, .19)" : "rgba(62, 184, 255, .14)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);

  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  for (const star of state.stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillRect(star.x, star.y, star.size, star.size * (overdrive ? 4 : 2.2));
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(105, 231, 255, .055)";
  ctx.lineWidth = 1;
  for (let x = -80; x < HERO_STRIKE_WIDTH + 80; x += 52) {
    ctx.beginPath();
    ctx.moveTo(HERO_STRIKE_WIDTH / 2 + (x - HERO_STRIKE_WIDTH / 2) * 0.28, 180);
    ctx.lineTo(x, HERO_STRIKE_HEIGHT);
    ctx.stroke();
  }
  for (let y = 240; y < HERO_STRIKE_HEIGHT; y += 58) {
    const progress = (y - 180) / (HERO_STRIKE_HEIGHT - 180);
    ctx.globalAlpha = 0.025 + progress * 0.06;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(HERO_STRIKE_WIDTH, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
