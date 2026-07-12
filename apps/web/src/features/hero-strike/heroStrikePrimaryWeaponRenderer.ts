import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { getHeroStrikePrimaryWeaponStatus } from "./heroStrikePrimaryWeaponSystem";
import type { HeroStrikeState } from "./heroStrikeTypes";

function weaponAccent(kind: "pulse" | "scatter" | "rail", warning: boolean) {
  if (warning) return HERO_STRIKE_COLORS.red;
  if (kind === "scatter") return HERO_STRIKE_COLORS.orange;
  if (kind === "rail") return HERO_STRIKE_COLORS.gold;
  return HERO_STRIKE_COLORS.cyan;
}

export function drawHeroStrikePrimaryWeaponWorld(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const status = getHeroStrikePrimaryWeaponStatus(state);
  if (status.muzzleFlash <= 0) return;
  const player = state.player;
  const alpha = Math.min(1, status.muzzleFlash / 0.1);
  const accent = weaponAccent(status.kind, status.warning);

  ctx.save();
  ctx.translate(player.x, player.y - 37 + status.recoil * 3);
  ctx.globalAlpha = alpha;
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, status.kind === "rail" ? 34 : 24);
  glow.addColorStop(0, "rgba(255,255,255,.95)");
  glow.addColorStop(0.28, accent);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, status.kind === "rail" ? 34 : 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(0, status.kind === "rail" ? -38 : -25);
  ctx.lineTo(5, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export function drawHeroStrikePrimaryWeaponHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const status = getHeroStrikePrimaryWeaponStatus(state);
  const accent = weaponAccent(status.kind, status.warning);
  const x = 18;
  const y = 681;
  const width = 182;

  roundedRect(ctx, x, y, width, 22, 9);
  ctx.fillStyle = "rgba(3,9,21,.88)";
  ctx.fill();
  ctx.strokeStyle = status.warning ? "rgba(255,95,109,.72)" : "rgba(255,255,255,.12)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "1000 8px system-ui";
  ctx.fillText(status.kind === "pulse" ? "PULSE REPEATER" : status.kind === "scatter" ? "BREACHER" : "ARC RAIL", x + 8, y + 10);
  ctx.textAlign = "right";
  ctx.fillStyle = status.warning ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.white;
  ctx.font = "900 8px system-ui";
  ctx.fillText(status.label, x + width - 8, y + 10);

  if (status.kind === "scatter") {
    const shellWidth = 22;
    const gap = 4;
    const totalWidth = status.magazine * shellWidth + (status.magazine - 1) * gap;
    const startX = x + (width - totalWidth) / 2;
    for (let index = 0; index < status.magazine; index += 1) {
      ctx.fillStyle = index < status.shells ? HERO_STRIKE_COLORS.orange : "rgba(255,255,255,.1)";
      ctx.fillRect(startX + index * (shellWidth + gap), y + 14, shellWidth, 3);
    }
  } else {
    const barX = x + 8;
    const barWidth = width - 16;
    ctx.fillStyle = "rgba(255,255,255,.09)";
    ctx.fillRect(barX, y + 15, barWidth, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(barX, y + 15, barWidth * Math.max(0, Math.min(1, status.ratio)), 3);
  }
  ctx.textAlign = "left";
}
