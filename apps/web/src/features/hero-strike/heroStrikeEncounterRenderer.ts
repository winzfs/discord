import { getHeroStrikeMissionSnapshot } from "./heroStrikeEncounterDirector";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { getHeroStrikeSalvageBalance } from "./heroStrikeSalvage";
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

function drawHoldZone(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const snapshot = getHeroStrikeMissionSnapshot(state);
  if (snapshot.definition.kind !== "hold" || snapshot.status !== "active") return;
  const pulse = Math.sin(state.elapsed * 5) * 0.5 + 0.5;

  ctx.save();
  ctx.globalAlpha = snapshot.insideZone ? 0.18 + pulse * 0.05 : 0.1;
  ctx.fillStyle = snapshot.definition.accent;
  ctx.beginPath();
  ctx.arc(snapshot.zoneX, snapshot.zoneY, snapshot.zoneRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.5 + pulse * 0.3;
  ctx.strokeStyle = snapshot.definition.accent;
  ctx.lineWidth = snapshot.insideZone ? 4 : 2;
  ctx.setLineDash(snapshot.insideZone ? [] : [9, 8]);
  ctx.beginPath();
  ctx.arc(snapshot.zoneX, snapshot.zoneY, snapshot.zoneRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.85;
  ctx.textAlign = "center";
  ctx.fillStyle = snapshot.definition.accent;
  ctx.font = "900 10px system-ui";
  ctx.fillText(snapshot.insideZone ? "SIGNAL LOCK" : "HOLD ZONE", snapshot.zoneX, snapshot.zoneY + 4);
  ctx.restore();
  ctx.textAlign = "left";
}

function drawPriorityTarget(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const snapshot = getHeroStrikeMissionSnapshot(state);
  if (snapshot.status !== "active" || snapshot.targetEnemyId === null) return;
  const target = state.enemies.find((enemy) => enemy.id === snapshot.targetEnemyId && !enemy.dead);
  if (!target) return;
  const pulse = Math.sin(state.elapsed * 8) * 3;
  const radius = target.radius + 11 + pulse;

  ctx.save();
  ctx.strokeStyle = snapshot.definition.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    ctx.beginPath();
    ctx.moveTo(target.x + Math.cos(angle) * (radius - 5), target.y + Math.sin(angle) * (radius - 5));
    ctx.lineTo(target.x + Math.cos(angle) * (radius + 9), target.y + Math.sin(angle) * (radius + 9));
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.fillStyle = snapshot.definition.accent;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("PRIORITY", target.x, target.y - radius - 9);
  ctx.restore();
  ctx.textAlign = "left";
}

function progressText(state: HeroStrikeState) {
  const snapshot = getHeroStrikeMissionSnapshot(state);
  const target = snapshot.definition.target;
  if (snapshot.definition.kind === "hold") {
    return `${snapshot.progress.toFixed(1)} / ${target.toFixed(1)}s`;
  }
  if (snapshot.definition.kind === "intercept") {
    return snapshot.targetEnemyId === null ? "표적 탐색 중" : "표적 이탈 전 격파";
  }
  return `${Math.min(Math.floor(snapshot.progress), target)} / ${target}`;
}

export function drawHeroStrikeEncounterWorld(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  if (state.bossSpawned) return;
  drawHoldZone(ctx, state);
  drawPriorityTarget(ctx, state);
}

export function drawHeroStrikeEncounterHud(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  if (state.bossSpawned) return;
  const snapshot = getHeroStrikeMissionSnapshot(state);
  const salvage = getHeroStrikeSalvageBalance(state);
  const x = 30;
  const y = 126;
  const width = HERO_STRIKE_WIDTH - 60;
  const height = 54;
  const success = snapshot.status === "succeeded";
  const failed = snapshot.status === "failed";
  const accent = success
    ? HERO_STRIKE_COLORS.green
    : failed
      ? HERO_STRIKE_COLORS.red
      : snapshot.definition.accent;

  roundedRect(ctx, x, y, width, height, 14);
  ctx.fillStyle = "rgba(3,9,21,.84)";
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.58;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "1000 10px system-ui";
  ctx.fillText(snapshot.definition.label, x + 12, y + 17);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 11px system-ui";
  ctx.fillText(
    success ? "임무 완료" : failed ? "임무 실패" : snapshot.definition.title,
    x + 82,
    y + 17,
  );

  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 8px system-ui";
  ctx.fillText(snapshot.definition.brief, x + 12, y + 31);

  ctx.fillStyle = "rgba(255,255,255,.09)";
  ctx.fillRect(x + 12, y + 39, width - 92, 5);
  ctx.fillStyle = accent;
  ctx.fillRect(x + 12, y + 39, (width - 92) * snapshot.ratio, 5);

  ctx.textAlign = "right";
  ctx.fillStyle = accent;
  ctx.font = "900 9px system-ui";
  ctx.fillText(progressText(state), x + width - 12, y + 44);
  ctx.fillStyle = HERO_STRIKE_COLORS.gold;
  ctx.font = "900 8px system-ui";
  ctx.fillText(`SALVAGE ${salvage}`, x + width - 12, y + 17);
  ctx.textAlign = "left";
}
