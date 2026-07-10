import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

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

  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
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

function enemyPalette(enemy: HeroStrikeEnemy) {
  if (enemy.kind === "runner") return { fill: "#3f9cc9", accent: "#9be8ff" };
  if (enemy.kind === "drone") return { fill: "#4e9c4d", accent: "#a8ff8b" };
  if (enemy.kind === "tank") return { fill: "#7b5a91", accent: "#e5b7ff" };
  return { fill: "#8d3d43", accent: "#ffd166" };
}

function drawEnemy(ctx: CanvasRenderingContext2D, enemy: HeroStrikeEnemy) {
  const palette = enemyPalette(enemy);
  const radius = enemy.radius;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(Math.sin(enemy.age * 4 + enemy.phase) * (enemy.boss ? 0.035 : 0.08));

  ctx.fillStyle = enemy.boss ? "rgba(255,209,102,.12)" : "rgba(0,0,0,.24)";
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.62, radius * (enemy.boss ? 1.15 : 0.9), radius * (enemy.boss ? 0.42 : 0.25), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = "rgba(4,10,18,.85)";
  ctx.lineWidth = enemy.boss ? 4 : 2.5;

  if (enemy.boss) {
    ctx.beginPath();
    ctx.roundRect(-radius * 1.1, -radius * 0.75, radius * 2.2, radius * 1.5, radius * 0.35);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.7, -radius * 0.65);
    ctx.lineTo(-radius * 1.15, -radius * 1.12);
    ctx.lineTo(-radius * 0.38, -radius * 0.84);
    ctx.moveTo(radius * 0.7, -radius * 0.65);
    ctx.lineTo(radius * 1.15, -radius * 1.12);
    ctx.lineTo(radius * 0.38, -radius * 0.84);
    ctx.strokeStyle = palette.accent;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (enemy.kind === "runner" ? 0.82 : 1), radius * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = palette.accent;
  const eyeY = enemy.boss ? -8 : -3;
  const eyeGap = enemy.boss ? 19 : 6;
  const eyeSize = enemy.boss ? 5 : 2.6;
  ctx.beginPath();
  ctx.arc(-eyeGap, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.arc(eyeGap, eyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  if (!enemy.boss && enemy.hp < enemy.maxHp) {
    const width = radius * 1.8;
    ctx.fillStyle = "rgba(0,0,0,.5)";
    ctx.fillRect(-width / 2, -radius - 10, width, 3);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(-width / 2, -radius - 10, width * Math.max(0, enemy.hp / enemy.maxHp), 3);
  }
  ctx.restore();
}

function drawBullets(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.color;
    if (bullet.enemy) {
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 1.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(bullet.x - bullet.radius * 0.25, bullet.y - bullet.radius * 0.25, bullet.radius * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.2;
      ctx.fillRect(bullet.x - bullet.radius * 1.8, bullet.y - 13, bullet.radius * 3.6, 26);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.roundRect(bullet.x - bullet.radius, bullet.y - 12, bullet.radius * 2, 24, bullet.radius);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPickups(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const pickup of state.pickups) {
    const color = pickup.kind === "heal" ? HERO_STRIKE_COLORS.green : pickup.kind === "charge" ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
    const angle = state.elapsed * 3 + pickup.id;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const radius = pickup.radius;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y, radius * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(pickup.x + cos * radius, pickup.y + sin * radius);
    ctx.lineTo(pickup.x - sin * radius, pickup.y + cos * radius);
    ctx.lineTo(pickup.x - cos * radius, pickup.y - sin * radius);
    ctx.lineTo(pickup.x + sin * radius, pickup.y - cos * radius);
    ctx.closePath();
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
  drawPickups(ctx, state);
  drawBullets(ctx, state);
  state.enemies.forEach((enemy) => drawEnemy(ctx, enemy));
  drawTracer(ctx, state);
  drawEffects(ctx, state);
}
