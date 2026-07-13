import { getHeroStrikeCombatContract } from "./heroStrikeCombatContract";
import { getHeroStrikeCombatRank } from "./heroStrikeCombatRank";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeMissionSnapshot } from "./heroStrikeEncounterDirector";
import { getHeroStrikePressureSnapshot } from "./heroStrikePressureDirector";
import type { HeroStrikeState } from "./heroStrikeTypes";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function missionProgressText(state: HeroStrikeState) {
  const mission = getHeroStrikeMissionSnapshot(state);
  if (mission.definition.kind === "hold") {
    return `${mission.progress.toFixed(1)} / ${mission.definition.target.toFixed(1)}s`;
  }
  if (mission.definition.kind === "intercept") {
    return mission.targetEnemyId === null ? "SEARCH" : "LOCKED";
  }
  return `${Math.min(Math.floor(mission.progress), mission.definition.target)} / ${mission.definition.target}`;
}

function drawMissionPanel(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.bossSpawned) return;
  const mission = getHeroStrikeMissionSnapshot(state);
  const contract = getHeroStrikeCombatContract(state);
  const rank = getHeroStrikeCombatRank(state);
  const x = 18;
  const y = 188;
  const width = HERO_STRIKE_WIDTH - 36;
  const height = 54;

  roundedRect(ctx, x, y, width, height, 13);
  ctx.fillStyle = "rgba(3,8,20,.9)";
  ctx.fill();
  ctx.strokeStyle = mission.definition.accent;
  ctx.globalAlpha = 0.62;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "left";
  ctx.fillStyle = mission.definition.accent;
  ctx.font = "1000 9px system-ui";
  ctx.fillText(`MISSION · ${mission.definition.label}`, x + 12, y + 16);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 11px system-ui";
  ctx.fillText(mission.definition.title, x + 12, y + 31);

  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 8px system-ui";
  ctx.fillText("COMBAT RANK", x + width - 12, y + 14);
  ctx.fillStyle = rank.grade === "S" ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.white;
  ctx.font = "1000 17px system-ui";
  ctx.fillText(rank.grade, x + width - 12, y + 32);

  ctx.fillStyle = "rgba(255,255,255,.09)";
  ctx.fillRect(x + 12, y + 41, width - 92, 5);
  ctx.fillStyle = mission.definition.accent;
  ctx.fillRect(x + 12, y + 41, (width - 92) * mission.ratio, 5);
  ctx.fillStyle = mission.definition.accent;
  ctx.font = "900 8px system-ui";
  ctx.fillText(missionProgressText(state), x + width - 12, y + 47);

  ctx.textAlign = "left";
  ctx.fillStyle = contract.accent;
  ctx.font = "900 7px system-ui";
  ctx.fillText(`${contract.label} · ${contract.statusLabel}`, x + 12, y + 52);
}

function drawPressurePanel(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const pressure = getHeroStrikePressureSnapshot(state);
  const contract = getHeroStrikeCombatContract(state);
  const y = state.bossSpawned ? 222 : 249;
  const x = 18;
  const width = HERO_STRIKE_WIDTH - 36;
  const height = 30;

  roundedRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = "rgba(3,8,20,.86)";
  ctx.fill();
  ctx.strokeStyle = pressure.accent;
  ctx.globalAlpha = 0.42;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = pressure.accent;
  ctx.font = "1000 8px system-ui";
  ctx.textAlign = "left";
  ctx.fillText(`THREAT · ${pressure.label}`, x + 10, y + 12);
  ctx.fillStyle = contract.eligible ? contract.accent : HERO_STRIKE_COLORS.red;
  ctx.textAlign = "right";
  ctx.fillText(contract.title, x + width - 10, y + 12);

  const barX = x + 10;
  const barY = y + 18;
  const barWidth = width - 20;
  const gap = 3;
  const segmentWidth = (barWidth - gap * 4) / 5;
  for (let index = 0; index < 5; index += 1) {
    const threshold = (index + 1) / 5;
    ctx.fillStyle = pressure.ratio >= threshold - 0.19
      ? pressure.accent
      : "rgba(255,255,255,.09)";
    ctx.fillRect(barX + index * (segmentWidth + gap), barY, segmentWidth, 5);
  }
  ctx.textAlign = "left";
}

function drawPressureEvent(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const eventLabel = getHeroStrikePressureSnapshot(state).eventLabel;
  if (!eventLabel) return;
  const pulse = 0.72 + Math.sin(state.elapsed * 12) * 0.18;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = "center";
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "1000 15px system-ui";
  ctx.fillText(eventLabel, HERO_STRIKE_WIDTH / 2, state.bossSpawned ? 270 : 298);
  ctx.restore();
  ctx.textAlign = "left";
}

export function drawHeroStrikeTacticalHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  drawMissionPanel(ctx, state);
  drawPressurePanel(ctx, state);
  drawPressureEvent(ctx, state);
}
