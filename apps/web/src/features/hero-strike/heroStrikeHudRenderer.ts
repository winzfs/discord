import {
  BLINK_BUTTON,
  HERO_STRIKE_COLORS,
  HERO_STRIKE_WIDTH,
  PAUSE_BUTTON,
  ULTIMATE_BUTTON,
} from "./heroStrikeConfig";
import { getHeroStrikeEncounter } from "./heroStrikeEncounters";
import { isHeroStrikeFlowRush } from "./heroStrikeFlow";
import { drawHeroStrikeOverlay } from "./heroStrikeOverlayRenderer";
import { getCurrentHeroStrikeStage, HERO_STRIKE_STAGES } from "./heroStrikeStages";
import { getFlowRushDuration } from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawEncounterSegments(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const startX = 20;
  const y = 66;
  const gap = 5;
  const width = (HERO_STRIKE_WIDTH - 40 - gap * 3) / 4;
  for (let index = 0; index < 4; index += 1) {
    const encounter = getHeroStrikeEncounter(index + 1);
    ctx.fillStyle = index + 1 < state.waveIndex
      ? "rgba(121,242,157,.7)"
      : index + 1 === state.waveIndex
        ? encounter.accent
        : "rgba(255,255,255,.1)";
    ctx.fillRect(startX + index * (width + gap), y, width, 4);
  }
}

function drawTopHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const stage = getCurrentHeroStrikeStage(state);
  const encounter = getHeroStrikeEncounter(state.waveIndex);
  roundedRect(ctx, 12, 10, HERO_STRIKE_WIDTH - 24, 84, 18);
  ctx.fillStyle = "rgba(4,10,24,.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(105,231,255,.18)";
  ctx.stroke();

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText("OPERATION", 24, 29);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 14px system-ui";
  ctx.fillText(`${state.stageIndex + 1}/${HERO_STRIKE_STAGES.length}`, 24, 49);

  ctx.textAlign = "center";
  ctx.fillStyle = state.bossSpawned ? HERO_STRIKE_COLORS.red : encounter.accent;
  ctx.font = "1000 15px system-ui";
  ctx.fillText(state.bossSpawned ? "BOSS" : encounter.label, HERO_STRIKE_WIDTH / 2, 31);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 8px system-ui";
  ctx.fillText(state.bossSpawned ? stage.bossName : encounter.subtitle, HERO_STRIKE_WIDTH / 2, 49);

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText("TIME", HERO_STRIKE_WIDTH - 24, 29);
  const remaining = Math.max(0, Math.ceil(stage.durationSeconds - state.stageElapsed));
  ctx.fillStyle = state.bossSpawned ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.white;
  ctx.font = "1000 14px system-ui";
  ctx.fillText(state.bossSpawned ? "FINAL" : `${remaining}s`, HERO_STRIKE_WIDTH - 24, 49);
  ctx.textAlign = "left";

  drawEncounterSegments(ctx, state);
  const xpRatio = Math.max(0, Math.min(1, state.player.xp / state.player.nextXp));
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(20, 78, HERO_STRIKE_WIDTH - 40, 5);
  ctx.fillStyle = HERO_STRIKE_COLORS.xp;
  ctx.fillRect(20, 78, (HERO_STRIKE_WIDTH - 40) * xpRatio, 5);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 8px system-ui";
  ctx.fillText(`LV.${state.player.level}`, 22, 91);
}

function drawFlow(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  const rush = isHeroStrikeFlowRush(state);
  const maximumRush = getFlowRushDuration(player.overdriveLevel) + 2;
  const ratio = rush
    ? Math.max(0, Math.min(1, player.flowRush / maximumRush))
    : Math.max(0, Math.min(1, player.flow / player.flowMax));
  const x = 205;
  const y = 102;
  const width = 150;
  const color = rush ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.purple;

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * ratio, 5);
  ctx.font = "900 8px system-ui";
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.fillText(rush ? `RUSH ${player.flowRush.toFixed(1)}s` : `FLOW ${Math.round(player.flow)}%`, x + width, y + 14);
  ctx.textAlign = "left";
}

function drawHealthAndCombo(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const player = state.player;
  const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
  roundedRect(ctx, 20, 99, 166, 24, 8);
  ctx.fillStyle = "rgba(4,10,24,.78)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,155,61,.34)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(27, 115, 101, 4);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fillRect(27, 115, 101 * hpRatio, 4);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 8px system-ui";
  ctx.fillText(`HP ${player.hp}/${player.maxHp}`, 27, 110);
  ctx.fillStyle = HERO_STRIKE_COLORS.shield;
  ctx.fillText(`SHIELD ${player.shield}`, 136, 116);

  if (player.combo < 3) return;
  ctx.textAlign = "center";
  ctx.fillStyle = isHeroStrikeFlowRush(state) ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
  ctx.font = `1000 ${Math.min(26, 15 + player.combo * 0.12)}px system-ui`;
  ctx.fillText(`${player.combo} COMBO`, HERO_STRIKE_WIDTH / 2, state.bossSpawned ? 236 : 156);
  ctx.textAlign = "left";
}

function drawBlink(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const { x, y, radius } = BLINK_BUTTON;
  const player = state.player;
  const ratio = player.blinkCharges >= player.blinkMaxCharges || player.blinkRechargeDuration <= 0
    ? 1
    : 1 - Math.max(0, player.blinkRecharge) / player.blinkRechargeDuration;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(4,10,24,.82)";
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = player.blinkCharges > 0 ? HERO_STRIKE_COLORS.cyan : "rgba(255,255,255,.18)";
  ctx.lineWidth = 4;
  ctx.stroke();
  if (player.blinkCharges < player.blinkMaxCharges) {
    ctx.strokeStyle = HERO_STRIKE_COLORS.cyan;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }
  ctx.fillStyle = player.blinkCharges > 0 ? HERO_STRIKE_COLORS.cyan : HERO_STRIKE_COLORS.muted;
  ctx.textAlign = "center";
  ctx.font = "1000 20px system-ui";
  ctx.fillText("»", 0, 6);
  ctx.font = "900 9px system-ui";
  ctx.fillText(`${player.blinkCharges}/${player.blinkMaxCharges}`, 0, 23);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawUltimate(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const { x, y, radius } = ULTIMATE_BUTTON;
  const ratio = state.player.ultimate / state.player.ultimateMax;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(4,10,24,.82)";
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
  roundedRect(ctx, 42, 166, HERO_STRIKE_WIDTH - 84, 48, 12);
  ctx.fillStyle = "rgba(5,7,16,.86)";
  ctx.fill();
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  ctx.fillStyle = phase >= 3 ? HERO_STRIKE_COLORS.red : phase >= 2 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
  ctx.fillRect(51, 175, (HERO_STRIKE_WIDTH - 102) * ratio, 9);
  const breakRatio = (boss.breakStun ?? 0) > 0
    ? 1
    : Math.max(0, Math.min(1, (boss.breakGauge ?? 0) / Math.max(1, boss.breakMax ?? 1)));
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(51, 190, HERO_STRIKE_WIDTH - 102, 5);
  ctx.fillStyle = (boss.breakStun ?? 0) > 0 ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.purple;
  ctx.fillRect(51, 190, (HERO_STRIKE_WIDTH - 102) * breakRatio, 5);
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 9px system-ui";
  const status = (boss.breakStun ?? 0) > 0 ? `BREAK ${boss.breakStun?.toFixed(1)}s` : `PHASE ${phase}`;
  ctx.fillText(`${stage.bossName} · ${status}`, HERO_STRIKE_WIDTH / 2, 207);
  ctx.textAlign = "left";
}

function drawPauseButton(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "rgba(4,10,24,.72)";
  ctx.beginPath();
  ctx.arc(PAUSE_BUTTON.x, PAUSE_BUTTON.y, PAUSE_BUTTON.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.fillRect(PAUSE_BUTTON.x - 6, PAUSE_BUTTON.y - 8, 4, 16);
  ctx.fillRect(PAUSE_BUTTON.x + 2, PAUSE_BUTTON.y - 8, 4, 16);
}

function showsCombatHud(state: HeroStrikeState) {
  return state.phase === "playing" || state.phase === "paused" || state.phase === "level-up" || state.phase === "stage-clear";
}

export function drawHeroStrikeHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (showsCombatHud(state)) {
    drawTopHud(ctx, state);
    drawFlow(ctx, state);
    drawHealthAndCombo(ctx, state);
    drawBlink(ctx, state);
    drawUltimate(ctx, state);
    drawBossBar(ctx, state);
    if (state.phase === "playing") drawPauseButton(ctx);
  }
  drawHeroStrikeOverlay(ctx, state);
}
