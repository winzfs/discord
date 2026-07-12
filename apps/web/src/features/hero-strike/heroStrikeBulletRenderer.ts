import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { isHeroStrikeReducedEffects } from "./heroStrikePerformance";
import type { HeroStrikeBullet, HeroStrikeState } from "./heroStrikeTypes";

type Direction = { dx: number; dy: number; nx: number; ny: number };

function bulletDirection(bullet: HeroStrikeBullet): Direction {
  const length = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) || 1;
  const dx = bullet.vx / length;
  const dy = bullet.vy / length;
  return { dx, dy, nx: -dy, ny: dx };
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  bullet: HeroStrikeBullet,
  direction: Direction,
  length: number,
  width: number,
  color: string,
  alpha = 1,
) {
  const halfLength = length * 0.5;
  const halfWidth = width * 0.5;
  const frontX = bullet.x + direction.dx * halfLength;
  const frontY = bullet.y + direction.dy * halfLength;
  const backX = bullet.x - direction.dx * halfLength;
  const backY = bullet.y - direction.dy * halfLength;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(frontX + direction.nx * halfWidth, frontY + direction.ny * halfWidth);
  ctx.lineTo(frontX - direction.nx * halfWidth, frontY - direction.ny * halfWidth);
  ctx.lineTo(backX - direction.nx * halfWidth, backY - direction.ny * halfWidth);
  ctx.lineTo(backX + direction.nx * halfWidth, backY + direction.ny * halfWidth);
  ctx.closePath();
  ctx.fill();
}

function drawPulseBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet, reduced: boolean) {
  const direction = bulletDirection(bullet);
  if (!reduced) drawBeam(ctx, bullet, direction, 34, bullet.radius * 3.2, bullet.color, 0.2);
  drawBeam(ctx, bullet, direction, 22, bullet.radius * 1.65, bullet.color);
}

function drawScatterBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet, reduced: boolean) {
  const direction = bulletDirection(bullet);
  if (!reduced) drawBeam(ctx, bullet, direction, 18, bullet.radius * 2.8, bullet.color, 0.22);
  const frontX = bullet.x + direction.dx * bullet.radius * 1.55;
  const frontY = bullet.y + direction.dy * bullet.radius * 1.55;
  const backX = bullet.x - direction.dx * bullet.radius * 1.15;
  const backY = bullet.y - direction.dy * bullet.radius * 1.15;
  ctx.globalAlpha = 1;
  ctx.fillStyle = bullet.color;
  ctx.beginPath();
  ctx.moveTo(frontX, frontY);
  ctx.lineTo(bullet.x + direction.nx * bullet.radius, bullet.y + direction.ny * bullet.radius);
  ctx.lineTo(backX, backY);
  ctx.lineTo(bullet.x - direction.nx * bullet.radius, bullet.y - direction.ny * bullet.radius);
  ctx.closePath();
  ctx.fill();
}

function drawRailBullet(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet, reduced: boolean) {
  const direction = bulletDirection(bullet);
  if (!reduced) drawBeam(ctx, bullet, direction, 60, bullet.radius * 4, HERO_STRIKE_COLORS.purple, 0.18);
  drawBeam(ctx, bullet, direction, 48, bullet.radius * 1.4, HERO_STRIKE_COLORS.cyan, 0.86);
  drawBeam(ctx, bullet, direction, 54, 3, HERO_STRIKE_COLORS.white);
}

function drawEnemyOrb(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet, reduced: boolean) {
  if (!reduced) {
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(34,3,15,.95)";
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = bullet.color;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, Math.max(1.6, bullet.radius * 0.3), 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemyNeedle(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  const direction = bulletDirection(bullet);
  const frontX = bullet.x + direction.dx * bullet.radius * 2.6;
  const frontY = bullet.y + direction.dy * bullet.radius * 2.6;
  const backX = bullet.x - direction.dx * bullet.radius * 1.8;
  const backY = bullet.y - direction.dy * bullet.radius * 1.8;
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.beginPath();
  ctx.moveTo(frontX, frontY);
  ctx.lineTo(backX + direction.nx * bullet.radius * 0.72, backY + direction.ny * bullet.radius * 0.72);
  ctx.lineTo(backX - direction.nx * bullet.radius * 0.72, backY - direction.ny * bullet.radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.fillRect(bullet.x - 1, bullet.y - 1, 3, 3);
}

function drawEnemyShard(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet) {
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
  ctx.beginPath();
  ctx.moveTo(bullet.x, bullet.y - bullet.radius * 1.35);
  ctx.lineTo(bullet.x + bullet.radius, bullet.y);
  ctx.lineTo(bullet.x, bullet.y + bullet.radius * 1.35);
  ctx.lineTo(bullet.x - bullet.radius, bullet.y);
  ctx.closePath();
  ctx.fill();
}

function drawEnemyHeavy(ctx: CanvasRenderingContext2D, bullet: HeroStrikeBullet, reduced: boolean) {
  if (!reduced) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = HERO_STRIKE_COLORS.hostile;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.hostileCore;
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7c173c";
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHeroStrikeBullets(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const reduced = isHeroStrikeReducedEffects();
  for (const bullet of state.bullets) {
    if (bullet.enemy) {
      if (bullet.variant === "needle") drawEnemyNeedle(ctx, bullet);
      else if (bullet.variant === "shard") drawEnemyShard(ctx, bullet);
      else if (bullet.variant === "heavy") drawEnemyHeavy(ctx, bullet, reduced);
      else drawEnemyOrb(ctx, bullet, reduced);
      continue;
    }

    if (bullet.style === "rail-driver") drawRailBullet(ctx, bullet, reduced);
    else if (bullet.style === "scatter-array") drawScatterBullet(ctx, bullet, reduced);
    else drawPulseBullet(ctx, bullet, reduced);
  }
  ctx.globalAlpha = 1;
}
