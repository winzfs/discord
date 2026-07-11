import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { drawHeroStrikeEnemy } from "./heroStrikeEnemyRenderer";
import { isHeroStrikeFlowRush } from "./heroStrikeFlow";
import { drawHeroStrikePickups } from "./heroStrikePickupRenderer";
import { drawHeroStrikeSupportWeapons } from "./heroStrikeSupportRenderer";
import type { HeroStrikeBullet, HeroStrikeState } from "./heroStrikeTypes";

function drawFlowAura(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (!isHeroStrikeFlowRush(state)) return;
  const player = state.player;
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
  player.flowRush = Math.max(0, player.flowRush);
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

function drawPulseBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = bullet.color;
  ctx.fillRect(-bullet.radius * 1.7, -18, bullet.radius * 3.4, 34);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.roundRect(-bullet.radius, -12, bullet.radius * 2, 24, bullet.radius);
  ctx.fill();
  ctx.restore();
}

function drawScatterBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = bullet.color;
  ctx.fillRect(-bullet.radius * 1.7, 2, bullet.radius * 3.4, 16);
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(0, -bullet.radius * 1.5);
  ctx.lineTo(bullet.radius, bullet.radius * 0.8);
  ctx.lineTo(0, bullet.radius * 1.4);
  ctx.lineTo(-bullet.radius, bullet.radius * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRailBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = HERO_STRIKE_COLORS.purple;
  ctx.fillRect(-bullet.radius * 2, -30, bullet.radius * 4, 60);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.fillRect(-bullet.radius * 0.7, -24, bullet.radius * 1.4, 48);
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(-1.5, -27, 3, 54);
  ctx.restore();
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
    if (bullet.style === "rail-driver") drawRailBullet(ctx, bullet);
    else if (bullet.style === "scatter-array") drawScatterBullet(ctx, bullet);
    else drawPulseBullet(ctx, bullet);
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
