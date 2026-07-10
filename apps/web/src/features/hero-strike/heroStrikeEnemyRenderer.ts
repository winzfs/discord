import type { HeroStrikeEnemy } from "./heroStrikeTypes";

function enemyPalette(enemy: HeroStrikeEnemy) {
  if (enemy.kind === "runner") return { fill: "#3f9cc9", accent: "#9be8ff" };
  if (enemy.kind === "drone") return { fill: "#4e9c4d", accent: "#a8ff8b" };
  if (enemy.kind === "tank") return { fill: "#7b5a91", accent: "#e5b7ff" };
  if (enemy.kind === "sniper") return { fill: "#8e405f", accent: "#ff9fc6" };
  if (enemy.kind === "weaver") return { fill: "#237f83", accent: "#7ffff4" };
  if (enemy.kind === "bomber") return { fill: "#9a5b2f", accent: "#ffd18a" };
  return { fill: "#8d3d43", accent: "#ffd166" };
}

function drawBossBody(ctx: CanvasRenderingContext2D, radius: number, accent: string) {
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
  ctx.strokeStyle = accent;
  ctx.stroke();
}

function drawRunner(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.82, radius * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawDrone(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(-radius * 0.55, -radius * 0.72);
  ctx.lineTo(radius * 0.55, -radius * 0.72);
  ctx.lineTo(radius, 0);
  ctx.lineTo(radius * 0.55, radius * 0.72);
  ctx.lineTo(-radius * 0.55, radius * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawTank(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.roundRect(-radius, -radius * 0.7, radius * 2, radius * 1.4, radius * 0.32);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(-radius * 1.15, -radius * 0.28, radius * 0.3, radius * 0.56);
  ctx.fillRect(radius * 0.85, -radius * 0.28, radius * 0.3, radius * 0.56);
}

function drawSniper(ctx: CanvasRenderingContext2D, radius: number, accent: string) {
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius * 0.78, radius * 0.45);
  ctx.lineTo(0, radius * 0.78);
  ctx.lineTo(-radius * 0.78, radius * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, radius * 0.28);
  ctx.lineTo(0, radius * 1.12);
  ctx.stroke();
}

function drawWeaver(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.48, radius * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius * 0.3, -radius * 0.15);
  ctx.lineTo(-radius * 1.2, -radius * 0.58);
  ctx.lineTo(-radius * 0.88, radius * 0.48);
  ctx.closePath();
  ctx.moveTo(radius * 0.3, -radius * 0.15);
  ctx.lineTo(radius * 1.2, -radius * 0.58);
  ctx.lineTo(radius * 0.88, radius * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBomber(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-radius * 0.62, radius * 0.55, radius * 0.3, 0, Math.PI * 2);
  ctx.arc(radius * 0.62, radius * 0.55, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawNormalBody(ctx: CanvasRenderingContext2D, enemy: HeroStrikeEnemy, accent: string) {
  if (enemy.kind === "runner") drawRunner(ctx, enemy.radius);
  else if (enemy.kind === "drone") drawDrone(ctx, enemy.radius);
  else if (enemy.kind === "tank") drawTank(ctx, enemy.radius);
  else if (enemy.kind === "sniper") drawSniper(ctx, enemy.radius, accent);
  else if (enemy.kind === "weaver") drawWeaver(ctx, enemy.radius);
  else drawBomber(ctx, enemy.radius);
}

export function drawHeroStrikeEnemy(ctx: CanvasRenderingContext2D, enemy: HeroStrikeEnemy) {
  const palette = enemyPalette(enemy);
  const radius = enemy.radius;
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(Math.sin(enemy.age * 4 + enemy.phase) * (enemy.boss ? 0.035 : enemy.kind === "weaver" ? 0.16 : 0.08));

  ctx.fillStyle = enemy.boss ? "rgba(255,209,102,.12)" : "rgba(0,0,0,.24)";
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.62, radius * (enemy.boss ? 1.15 : 0.9), radius * (enemy.boss ? 0.42 : 0.25), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.fill;
  ctx.strokeStyle = "rgba(4,10,18,.88)";
  ctx.lineWidth = enemy.boss ? 4 : 2.5;
  if (enemy.boss) drawBossBody(ctx, radius, palette.accent);
  else drawNormalBody(ctx, enemy, palette.accent);

  ctx.fillStyle = palette.accent;
  const eyeY = enemy.boss ? -8 : -3;
  const eyeGap = enemy.boss ? 19 : enemy.kind === "sniper" ? 0 : 6;
  const eyeSize = enemy.boss ? 5 : enemy.kind === "sniper" ? 3.4 : 2.6;
  ctx.beginPath();
  if (enemy.kind === "sniper") ctx.arc(0, eyeY, eyeSize, 0, Math.PI * 2);
  else {
    ctx.arc(-eyeGap, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(eyeGap, eyeY, eyeSize, 0, Math.PI * 2);
  }
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