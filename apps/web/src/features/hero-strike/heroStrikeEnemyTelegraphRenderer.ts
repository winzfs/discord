import {
  getHeroStrikeEnemyAction,
  getHeroStrikeEnemyTelegraphProgress,
} from "./heroStrikeEnemyActions";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeEnemy, HeroStrikeState } from "./heroStrikeTypes";

function drawTargetCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * (radius - 4), y + Math.sin(angle) * (radius - 4));
    ctx.lineTo(x + Math.cos(angle) * (radius + 7), y + Math.sin(angle) * (radius + 7));
    ctx.stroke();
  }
  ctx.restore();
}

function drawRunnerTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: HeroStrikeEnemy,
  targetX: number,
  targetY: number,
  progress: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.36 + progress * 0.5;
  ctx.strokeStyle = HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 2 + progress * 1.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  ctx.setLineDash([]);

  const pulseRadius = 19 - progress * 7;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, pulseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawTargetCross(ctx, targetX, targetY, 15 + (1 - progress) * 6, 0.45 + progress * 0.45);
}

function drawSniperTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: HeroStrikeEnemy,
  targetX: number,
  targetY: number,
  progress: number,
) {
  ctx.save();
  ctx.globalAlpha = 0.25 + progress * 0.7;
  ctx.strokeStyle = progress > 0.72 ? HERO_STRIKE_COLORS.white : HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 1 + progress * 2.4;
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y + enemy.radius * 0.35);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, 3 + progress * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawTargetCross(ctx, targetX, targetY, 10 + progress * 3, 0.35 + progress * 0.55);
}

function drawBomberTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: HeroStrikeEnemy,
  targetX: number,
  targetY: number,
  progress: number,
) {
  const blastRadius = enemy.elite ? 50 : 42;
  const ringRadius = blastRadius * (1.28 - progress * 0.28);

  ctx.save();
  ctx.globalAlpha = 0.12 + progress * 0.18;
  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.beginPath();
  ctx.arc(targetX, targetY, blastRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.42 + progress * 0.5;
  ctx.strokeStyle = HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 2.5 + progress * 1.5;
  ctx.beginPath();
  ctx.arc(targetX, targetY, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  ctx.setLineDash([5, 7]);
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(enemy.x, enemy.y);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();
  ctx.restore();
}

function drawEnemyTelegraph(
  ctx: CanvasRenderingContext2D,
  enemy: HeroStrikeEnemy,
) {
  const runtime = getHeroStrikeEnemyAction(enemy);
  if (!runtime || runtime.phase !== "telegraph") return;
  const progress = getHeroStrikeEnemyTelegraphProgress(enemy);

  if (runtime.kind === "runner-dash") {
    drawRunnerTelegraph(ctx, enemy, runtime.targetX, runtime.targetY, progress);
  } else if (runtime.kind === "sniper-shot") {
    drawSniperTelegraph(ctx, enemy, runtime.targetX, runtime.targetY, progress);
  } else {
    drawBomberTelegraph(ctx, enemy, runtime.targetX, runtime.targetY, progress);
  }
}

export function drawHeroStrikeEnemyTelegraphs(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  for (const enemy of state.enemies) {
    if (!enemy.dead && !enemy.boss) drawEnemyTelegraph(ctx, enemy);
  }
}
