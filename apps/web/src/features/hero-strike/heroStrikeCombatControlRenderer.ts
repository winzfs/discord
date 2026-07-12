import {
  getHeroStrikeCombatMode,
  getHeroStrikeFocusProgress,
  getHeroStrikeLockTarget,
  getHeroStrikeLockWidth,
  getPendingHeroStrikeUpgrades,
} from "./heroStrikeCombatControl";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

function drawLockLane(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const mode = getHeroStrikeCombatMode(state);
  const progress = getHeroStrikeFocusProgress(state);
  const target = getHeroStrikeLockTarget(state);
  const player = state.player;

  ctx.save();
  if (mode === "focus") {
    ctx.strokeStyle = target ? "rgba(255,209,102,.38)" : "rgba(255,255,255,.12)";
    ctx.lineWidth = 1.25;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - 31);
    ctx.lineTo(target?.x ?? player.x, target?.y ?? 154);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (!state.pointerActive && progress > 0) {
    ctx.strokeStyle = `rgba(105,231,255,${0.18 + progress * 0.34})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
  }

  if (target) {
    const pulse = Math.sin(state.elapsed * 9) * 2;
    const radius = target.radius + 9 + pulse;
    ctx.strokeStyle = HERO_STRIKE_COLORS.gold;
    ctx.lineWidth = target.boss ? 3 : 2;
    ctx.beginPath();
    ctx.arc(target.x, target.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      ctx.beginPath();
      ctx.moveTo(target.x + Math.cos(angle) * (radius - 4), target.y + Math.sin(angle) * (radius - 4));
      ctx.lineTo(target.x + Math.cos(angle) * (radius + 7), target.y + Math.sin(angle) * (radius + 7));
      ctx.stroke();
    }
  }

  if (mode === "focus" && !target) {
    const width = getHeroStrikeLockWidth(state);
    ctx.strokeStyle = "rgba(255,255,255,.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 9]);
    ctx.strokeRect(player.x - width, 142, width * 2, Math.max(20, player.y - 190));
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawControlStatus(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const mode = getHeroStrikeCombatMode(state);
  const focus = mode === "focus";
  const pending = getPendingHeroStrikeUpgrades(state);
  const x = 18;
  const y = 710;
  const width = 182;
  const centerX = x + width / 2;

  roundedRect(ctx, x, y, width, 34, 13);
  ctx.fillStyle = "rgba(3,9,21,.86)";
  ctx.fill();
  ctx.strokeStyle = focus ? "rgba(255,209,102,.72)" : "rgba(105,231,255,.52)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = focus ? HERO_STRIKE_COLORS.gold : HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 11px system-ui";
  ctx.fillText(focus ? "FOCUS FIRE" : "DRIVE", centerX, y + 14);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "700 8px system-ui";
  ctx.fillText(focus ? "LOCK · COMMIT · FIRE" : "MOVE · EVADE · PREPARE", centerX, y + 26);

  if (pending > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = HERO_STRIKE_COLORS.xp;
    ctx.font = "900 8px system-ui";
    ctx.fillText(`UP ${pending}`, x + width - 7, y + 12);
  }
  ctx.textAlign = "left";
}

export function drawHeroStrikeCombatControl(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  drawLockLane(ctx, state);
  drawControlStatus(ctx, state);
}
