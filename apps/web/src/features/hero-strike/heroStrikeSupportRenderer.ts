import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

function drawDrone(ctx: CanvasRenderingContext2D, x: number, y: number, side: number, pulse: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * 0.08);
  ctx.fillStyle = "rgba(184,255,90,.18)";
  ctx.beginPath();
  ctx.arc(0, 0, 13 + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#173322";
  ctx.strokeStyle = HERO_STRIKE_COLORS.lime;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-8, -6, 16, 12, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.lime;
  ctx.fillRect(-14, -2, 6, 4);
  ctx.fillRect(8, -2, 6, 4);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(-1.5, -1.5, 3, 3);
  ctx.restore();
}

function drawSupportDrones(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.player.supportDroneTime <= 0) return;
  const pulse = Math.sin(state.elapsed * 7) * 0.5 + 0.5;
  drawDrone(ctx, state.player.x - 31, state.player.y + 4, -1, pulse);
  drawDrone(ctx, state.player.x + 31, state.player.y + 4, 1, pulse);
}

function drawMissiles(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  for (const missile of state.missiles) {
    const angle = Math.atan2(missile.vy, missile.vx) + Math.PI / 2;
    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = HERO_STRIKE_COLORS.orange;
    ctx.fillRect(-2, 5, 4, 11);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#251309";
    ctx.strokeStyle = HERO_STRIKE_COLORS.orange;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawTimeWarpAura(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.player.timeWarp <= 0) return;
  ctx.strokeStyle = "rgba(53,241,255,.32)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 2; index += 1) {
    const radius = 38 + index * 12 + Math.sin(state.elapsed * 4 + index) * 4;
    ctx.beginPath();
    ctx.arc(state.player.x, state.player.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawHeroStrikeSupportWeapons(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawTimeWarpAura(ctx, state);
  drawSupportDrones(ctx, state);
  drawMissiles(ctx, state);
}