import { getTracerImage } from "./heroStrikeAssets";
import { drawHeroStrikeBullets } from "./heroStrikeBulletRenderer";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { drawHeroStrikeEnemy } from "./heroStrikeEnemyRenderer";
import { isHeroStrikeFlowRush } from "./heroStrikeFlow";
import { drawHeroStrikePickups } from "./heroStrikePickupRenderer";
import { drawHeroStrikeSupportWeapons } from "./heroStrikeSupportRenderer";
import type { HeroStrikeState } from "./heroStrikeTypes";

function drawFlowAura(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (!isHeroStrikeFlowRush(state)) return;
  const pulse = Math.sin(state.elapsed * 14) * 0.5 + 0.5;
  ctx.strokeStyle = `rgba(255,209,102,${0.34 + pulse * 0.28})`;
  ctx.lineWidth = 2.5;
  for (let index = 0; index < 2; index += 1) {
    ctx.beginPath();
    ctx.arc(0, 0, 31 + index * 9 + pulse * 4, -Math.PI * 0.85, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,209,102,.55)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 5; index += 1) {
    const x = -26 + index * 13 + Math.sin(state.elapsed * 9 + index) * 5;
    ctx.beginPath();
    ctx.moveTo(x, 28 + index % 2 * 5);
    ctx.lineTo(x - 5, 50 + pulse * 10);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,209,102,.24)";
  ctx.beginPath();
  ctx.ellipse(0, 14, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTracer(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  const blinking = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0;
  if (blinking) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  drawFlowAura(ctx, state);
  if (!isHeroStrikeFlowRush(state)) {
    ctx.fillStyle = "rgba(105,231,255,.16)";
    ctx.beginPath();
    ctx.ellipse(0, 14, 26, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const image = getTracerImage();
  if (image?.complete && image.naturalWidth > 0) {
    const frameHeight = image.naturalHeight / 4;
    const targetHeight = 72;
    const targetWidth = image.naturalWidth * (targetHeight / frameHeight);
    ctx.drawImage(image, 0, 0, image.naturalWidth, frameHeight, -targetWidth / 2, -43, targetWidth, targetHeight);
  } else {
    ctx.fillStyle = HERO_STRIKE_COLORS.orange;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = isHeroStrikeFlowRush(state) ? "rgba(255,209,102,.8)" : "rgba(105,231,255,.42)";
  ctx.lineWidth = isHeroStrikeFlowRush(state) ? 2 : 1;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = isHeroStrikeFlowRush(state) ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();

  if (player.shield > 0) {
    ctx.strokeStyle = "rgba(105,231,255,.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 28 + Math.sin(state.elapsed * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEffects(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const particle of state.particles) {
    ctx.globalAlpha = particle.alpha;
    if (particle.ring) {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 3 * particle.alpha;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  for (const text of state.texts) {
    ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
    ctx.fillStyle = text.color;
    ctx.font = `900 ${text.size}px system-ui`;
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

export function drawHeroStrikeEntities(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawHeroStrikePickups(ctx, state);
  drawHeroStrikeBullets(ctx, state);
  for (const enemy of state.enemies) drawHeroStrikeEnemy(ctx, enemy);
  drawHeroStrikeSupportWeapons(ctx, state);
  drawTracer(ctx, state);
  drawEffects(ctx, state);
}
