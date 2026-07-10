import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { drawHeroStrikeEnemy } from "./heroStrikeEnemyRenderer";
import { drawHeroStrikePickups } from "./heroStrikePickupRenderer";
import { drawHeroStrikeSupportWeapons } from "./heroStrikeSupportRenderer";
import type { HeroStrikeBullet, HeroStrikeState } from "./heroStrikeTypes";

function drawTracer(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  const blinking = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0;
  if (blinking) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = player.overdrive > 0 ? "rgba(255,209,102,.24)" : "rgba(105,231,255,.16)";
  ctx.beginPath();
  ctx.ellipse(0, 14, player.overdrive > 0 ? 32 : 26, player.overdrive > 0 ? 13 : 9, 0, 0, Math.PI * 2);
  ctx.fill();

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

  ctx.strokeStyle = "rgba(105,231,255,.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
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

function drawEnemyOrb(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius * 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = bullet.color;
  ctx.strokeStyle = "rgba(34,3,15,.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, Math.max(1.8, bullet.radius * 0.32), 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemyNeedle(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  const angle = Math.atan2(bullet.vy, bullet.vx);
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(angle);
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.strokeStyle = "rgba(34,3,15,.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bullet.radius * 2.6, 0);
  ctx.lineTo(-bullet.radius * 1.8, bullet.radius * 0.72);
  ctx.lineTo(-bullet.radius * 1.8, -bullet.radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.fillRect(-1, -1, 4, 2);
  ctx.restore();
}

function drawEnemyShard(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.strokeStyle = "rgba(34,3,15,.95)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y - bullet.radius * 1.35);
  ctx.lineTo(bullet.x + bullet.radius, bullet.y);
  ctx.lineTo(bullet.x, bullet.y + bullet.radius * 1.35);
  ctx.lineTo(bullet.x - bullet.radius, bullet.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawEnemyHeavy(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius * 2.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7c173c";
  ctx.strokeStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawBullets(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const bullet of state.bullets) {
    if (bullet.enemy) {
      if (bullet.variant === "needle") drawEnemyNeedle(ctx, bullet);
      else if (bullet.variant === "shard") drawEnemyShard(ctx, bullet);
      else if (bullet.variant === "heavy") drawEnemyHeavy(ctx, bullet);
      else drawEnemyOrb(ctx, bullet);
      continue;
    }

    ctx.fillStyle = bullet.color;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(bullet.x - bullet.radius * 1.8, bullet.y - 13, bullet.radius * 3.6, 26);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.roundRect(bullet.x - bullet.radius, bullet.y - 12, bullet.radius * 2, 24, bullet.radius);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
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
  drawBullets(ctx, state);
  state.enemies.forEach((enemy) => drawHeroStrikeEnemy(ctx, enemy));
  drawHeroStrikeSupportWeapons(ctx, state);
  drawTracer(ctx, state);
  drawEffects(ctx, state);
}