import {
  HERO_STRIKE_COLORS,
  HERO_STRIKE_WIDTH,
  PAUSE_BUTTON,
  ULTIMATE_BUTTON,
} from "./heroStrikeConfig";
import { drawHeroStrikeOverlay } from "./heroStrikeOverlayRenderer";
import { getCurrentHeroStrikeStage, HERO_STRIKE_STAGES } from "./heroStrikeStages";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawTopHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  roundedRect(ctx, 12, 12, HERO_STRIKE_WIDTH - 24, 72, 20);
  ctx.fillStyle = "rgba(4, 10, 24, .78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.18)";
  ctx.stroke();
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("SCORE", 28, 34);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 24px system-ui";
  ctx.fillText(state.score.toLocaleString(), 27, 62);

  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText(`STAGE ${state.stageIndex + 1}/${HERO_STRIKE_STAGES.length}`, HERO_STRIKE_WIDTH / 2, 34);
  ctx.fillStyle = state.bossSpawned ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.cyan;
  ctx.font = "900 21px system-ui";
  const remaining = Math.max(0, Math.ceil(stage.durationSeconds - state.stageElapsed));
  ctx.fillText(state.bossSpawned ? "BOSS" : `${remaining}s`, HERO_STRIKE_WIDTH / 2, 61);

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 10px system-ui";
  ctx.fillText("BEST", HERO_STRIKE_WIDTH - 28, 34);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 19px system-ui";
  ctx.fillText(state.highScore.toLocaleString(), HERO_STRIKE_WIDTH - 28, 61);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(18, 91, HERO_STRIKE_WIDTH - 36, 7);
  const xpRatio = Math.max(0, Math.min(1, state.player.xp / state.player.nextXp));
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(18, 91, (HERO_STRIKE_WIDTH - 36) * xpRatio, 7);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "800 10px system-ui";
  ctx.fillText(`LV.${state.player.level}`, 20, 112);
}

function drawSupportStatus(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const active = [
    state.player.homingMissileTime > 0 ? { label: "MISSILE", time: state.player.homingMissileTime, color: HERO_STRIKE_COLORS.orange } : null,
    state.player.supportDroneTime > 0 ? { label: "DRONE", time: state.player.supportDroneTime, color: HERO_STRIKE_COLORS.lime } : null,
    state.player.timeWarp > 0 ? { label: "SLOW", time: state.player.timeWarp, color: HERO_STRIKE_COLORS.xp } : null,
  ].filter((item): item is { label: string; time: number; color: string } => item !== null);

  let x = HERO_STRIKE_WIDTH - 28;
  ctx.textAlign = "right";
  ctx.font = "800 9px system-ui";
  for (const item of active.reverse()) {
    const text = `${item.label} ${Math.ceil(item.time)}s`;
    const width = ctx.measureText(text).width + 14;
    roundedRect(ctx, x - width, 103, width, 18, 8);
    ctx.fillStyle = "rgba(4,10,24,.72)";
    ctx.fill();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.fillText(text, x - 7, 116);
    x -= width + 5;
  }
  ctx.textAlign = "left";
}

function drawHealthAndCombo(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  for (let index = 0; index < player.maxHp; index += 1) {
    const x = 24 + index * 26;
    ctx.fillStyle = index < player.hp ? HERO_STRIKE_COLORS.orange : "rgba(255,255,255,.12)";
    ctx.beginPath();
    ctx.moveTo(x, 132);
    ctx.lineTo(x + 8, 124);
    ctx.lineTo(x + 16, 132);
    ctx.lineTo(x + 8, 143);
    ctx.closePath();
    ctx.fill();
  }
  for (let index = 0; index < player.shield; index += 1) {
    ctx.strokeStyle = HERO_STRIKE_COLORS.shield;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(114 + index * 20, 133, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.combo < 2) return;
  ctx.textAlign = "center";
  ctx.fillStyle = player.overdrive > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
  ctx.font = `900 ${Math.min(34, 20 + player.combo * 0.16)}px system-ui`;
  ctx.fillText(`${player.combo} COMBO`, HERO_STRIKE_WIDTH / 2, 150);
  if (player.overdrive > 0) {
    ctx.fillStyle = HERO_STRIKE_COLORS.orange;
    ctx.font = "900 11px system-ui";
    ctx.fillText("OVERDRIVE", HERO_STRIKE_WIDTH / 2, 169);
  }
  ctx.textAlign = "left";
}

function drawUltimate(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const { x, y, radius } = ULTIMATE_BUTTON;
  const ratio = state.player.ultimate / state.player.ultimateMax;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(4,10,24,.78)";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = ratio >= 1 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
  ctx.lineWidth = ratio >= 1 ? 7 : 6;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
  ctx.stroke();
  ctx.fillStyle = ratio >= 1 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
  ctx.textAlign = "center";
  ctx.font = "900 24px system-ui";
  ctx.fillText("◉", 0, 8);
  ctx.font = "800 8px system-ui";
  ctx.fillText(ratio >= 1 ? "PULSE" : `${Math.round(ratio * 100)}%`, 0, 25);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawBossBar(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const boss = state.enemies.find((enemy) => enemy.boss);
  if (!boss) return;
  const stage = getCurrentHeroStrikeStage(state);
  roundedRect(ctx, 42, 178, HERO_STRIKE_WIDTH - 84, 30, 12);
  ctx.fillStyle = "rgba(5,7,16,.78)";
  ctx.fill();
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = HERO_STRIKE_COLORS.red;
  ctx.fillRect(51, 187, (HERO_STRIKE_WIDTH - 102) * ratio, 9);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 10px system-ui";
  ctx.fillText(stage.bossName, HERO_STRIKE_WIDTH / 2, 203);
  ctx.textAlign = "left";
}

function drawPauseButton(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(4,10,24,.68)";
  ctx.beginPath();
  ctx.arc(PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(PAUSE_BUTTON.x - 6, PAUSE_BUTTON.y - 8, 4, 16);
  ctx.fillRect(PAUSE_BUTTON.x + 2, PAUSE_BUTTON.y - 8, 4, 16);
}

export function drawHeroStrikeHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "title") {
    drawTopHud(ctx, state);
    drawSupportStatus(ctx, state);
    drawHealthAndCombo(ctx, state);
    drawUltimate(ctx, state);
    drawBossBar(ctx, state);
    drawPauseButton(ctx);
  }
  drawHeroStrikeOverlay(ctx, state);
}