import { getTracerImage } from "./heroStrikeAssets";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeEnemy, HeroStrikePickup, HeroStrikeState } from "./heroStrikeTypes";

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
    if (bullet.enemy) {
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

function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function drawXpPickup(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  const pulse = 1 + Math.sin(pickup.life * 8 + pickup.id) * 0.08;
  const radius = pickup.radius * pulse;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(pickup.x - 1.5, pickup.y + radius, 3, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(2,18,34,.96)";
  diamondPath(ctx, pickup.x, pickup.y, radius + 3);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  diamondPath(ctx, pickup.x, pickup.y, radius);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  diamondPath(ctx, pickup.x, pickup.y, radius * 0.34);
  ctx.fill();
}

function pickupColor(pickup: HeroStrikePickup) {
  if (pickup.kind === "heal") return HERO_STRIKE_COLORS.green;
  if (pickup.kind === "charge") return HERO_STRIKE_COLORS.gold;
  if (pickup.kind === "shield") return HERO_STRIKE_COLORS.shield;
  if (pickup.kind === "bomb") return HERO_STRIKE_COLORS.orange;
  return HERO_STRIKE_COLORS.purple;
}

function drawSpecialPickup(ctx: CanvasRenderingContext2D, pickup: HeroStrikePickup) {
  const color = pickupColor(pickup);
  const radius = pickup.radius + Math.sin(pickup.life * 5 + pickup.id) * 0.8;
  ctx.fillStyle = "rgba(2,10,24,.94)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(pickup.x, pickup.y, radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  if (pickup.kind === "heal") {
    ctx.fillRect(pickup.x - 2, pickup.y - 7, 4, 14);
    ctx.fillRect(pickup.x - 7, pickup.y - 2, 14, 4);
  } else if (pickup.kind === "charge") {
    ctx.beginPath();
    ctx.moveTo(pickup.x + 2, pickup.y - 8);
    ctx.lineTo(pickup.x - 5, pickup.y + 1);
    ctx.lineTo(pickup.x, pickup.y + 1);
    ctx.lineTo(pickup.x - 2, pickup.y + 9);
    ctx.lineTo(pickup.x + 6, pickup.y - 2);
    ctx.lineTo(pickup.x + 1, pickup.y - 2);
    ctx.closePath();
    ctx.fill();
  } else if (pickup.kind === "shield") {
    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y - 8);
    ctx.lineTo(pickup.x + 7, pickup.y - 4);
    ctx.lineTo(pickup.x + 5, pickup.y + 5);
    ctx.lineTo(pickup.x, pickup.y + 9);
    ctx.lineTo(pickup.x - 5, pickup.y + 5);
    ctx.lineTo(pickup.x - 7, pickup.y - 4);
    ctx.closePath();
    ctx.stroke();
  } else if (pickup.kind === "bomb") {
    ctx.beginPath();
    ctx.arc(pickup.x, pickup.y + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pickup.x + 3, pickup.y - 4);
    ctx.lineTo(pickup.x + 7, pickup.y - 8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(pickup.x, pickup.y - 8);
    ctx.lineTo(pickup.x + 3, pickup.y - 2);
    ctx.lineTo(pickup.x + 8, pickup.y);
    ctx.lineTo(pickup.x + 3, pickup.y + 2);
    ctx.lineTo(pickup.x, pickup.y + 8);
    ctx.lineTo(pickup.x - 3, pickup.y + 2);
    ctx.lineTo(pickup.x - 8, pickup.y);
    ctx.lineTo(pickup.x - 3, pickup.y - 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPickups(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const pickup of state.pickups) {
    if (pickup.kind === "xp") drawXpPickup(ctx, pickup);
    else drawSpecialPickup(ctx, pickup);
  }
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