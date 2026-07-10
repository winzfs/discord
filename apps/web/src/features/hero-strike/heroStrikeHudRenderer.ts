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

type SupportStatusItem = {
  text: string;
  color: string;
};

function drawSupportStatus(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const active: SupportStatusItem[] = [];
  if (state.player.homingMissileLevel > 0) {
    active.push({ text: `MISSILE L${state.player.homingMissileLevel}`, color: HERO_STRIKE_COLORS.orange });
  }
  if (state.player.supportDroneLevel > 0) {
    active.push({ text: `DRONE L${state.player.supportDroneLevel}`, color: HERO_STRIKE_COLORS.lime });
  } else if (state.player.supportDroneTime > 0) {
    active.push({ text: `DRONE ${Math.ceil(state.player.supportDroneTime)}s`, color: HERO_STRIKE_COLORS.lime });
  }
  if (state.player.timeWarp > 0) {
    active.push({ text: `SLOW ${Math.ceil(state.player.timeWarp)}s`, color: HERO_STRIKE_COLORS.xp });
  }

  let x = HERO_STRIKE_WIDTH - 28;
  ctx.textAlign = "right";
  ctx.font = "800 9px system-ui";
  for (const item of active.reverse()) {
    const width = ctx.measureText(item.text).width + 14;
    roundedRect(ctx, x - width, 103, width, 18, 8);
    ctx.fillStyle = "rgba(4,10,24,.72)";
    ctx.fill();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = item.color;
    ctx.fillText(item.text, x - 7, 116);
    x -= width + 5;
  }
  ctx.textAlign = "left";
}

function drawHealthAndCombo(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
  roundedRect(ctx, 20, 124, 116, 21, 8);
  ctx.fillStyle = "rgba(4,10,24,.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,155,61,.34)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(26, 139, 104, 3);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fillRect(26, 139, 104 * hpRatio, 3);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 9px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`HP ${player.hp}/${player.maxHp}`, 78, 136);

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.shield;
  ctx.font = "900 9px system-ui";
  ctx.fillText(`SHIELD ${player.shield}`, 147, 137);

  if (player.combo < 2) return;
  ctx.textAlign = "center";
  ctx.fillStyle = player.overdrive > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
  ctx.font = `900 ${Math.min(30, 18 + player.combo * 0.14)}px system-ui`;
  ctx.fillText(`${player.combo} COMBO`, HERO_STRIKE_WIDTH / 2, 166);
  if (player.overdrive > 0 && !state.bossSpawned) {
    ctx.fillStyle = HERO_STRIKE_COLORS.orange;
    ctx.font = "900 9px system-ui";
    ctx.fillText("OVERDRIVE", HERO_STRIKE_WIDTH / 2, 177);
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
  const phase = boss.bossPhase ?? 1;
  roundedRect(ctx, 42, 178, HERO_STRIKE_WIDTH - 84, 34, 12);
  ctx.fillStyle = "rgba(5,7,16,.82)";
  ctx.fill();
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = phase >= 3 ? HERO_STRIKE_COLORS.red : phase >= 2 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
  ctx.fillRect(51, 187, (HERO_STRIKE_WIDTH - 102) * ratio, 9);
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 1;
  for (const threshold of [1 / 3, 2 / 3]) {
    const x = 51 + (HERO_STRIKE_WIDTH - 102) * threshold;
    ctx.beginPath();
    ctx.moveTo(x, 185);
    ctx.lineTo(x, 198);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 10px system-ui";
  ctx.fillText(`${stage.bossName} · PHASE ${phase}`, HERO_STRIKE_WIDTH / 2, 207);
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
