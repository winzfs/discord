import { getHeroStrikeAgency } from "./heroStrikeAgency";
import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeAgencyWorld(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const runtime = getHeroStrikeAgency(state);
  if (state.phase !== "playing" || runtime.artilleryWarning <= 0) return;

  const ratio = Math.max(0, Math.min(1, runtime.artilleryWarning / 0.95));
  const radius = 20 + ratio * 36;
  ctx.save();
  ctx.translate(runtime.artilleryX, runtime.artilleryY);
  ctx.globalAlpha = 0.35 + (1 - ratio) * 0.55;
  ctx.fillStyle = "rgba(255,53,109,.12)";
  ctx.strokeStyle = HERO_STRIKE_COLORS.red;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.rotate((1 - ratio) * Math.PI * 1.5);
  for (let index = 0; index < 4; index += 1) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(radius + 4, 0);
    ctx.lineTo(radius + 16, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.textAlign = "center";
  ctx.font = "900 9px system-ui";
  ctx.fillText("MOVE", 0, 3);
  ctx.restore();
  ctx.textAlign = "left";
}

export function drawHeroStrikeAgencyHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing" && state.phase !== "paused") return;
  const runtime = getHeroStrikeAgency(state);
  const x = 20;
  const y = 722;
  const width = 188;
  const ratio = runtime.tempo / 100;

  ctx.fillStyle = "rgba(3,9,20,.82)";
  ctx.beginPath();
  ctx.roundRect(x, y, width, 18, 8);
  ctx.fill();
  ctx.strokeStyle = ratio < 0.3 ? HERO_STRIKE_COLORS.red : ratio > 0.72 ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.cyan;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.fillRect(x + 5, y + 11, width - 10, 3);
  ctx.fillStyle = ratio < 0.3 ? HERO_STRIKE_COLORS.red : ratio > 0.72 ? HERO_STRIKE_COLORS.green : HERO_STRIKE_COLORS.cyan;
  ctx.fillRect(x + 5, y + 11, (width - 10) * ratio, 3);
  ctx.font = "900 9px system-ui";
  ctx.fillText(ratio < 0.28 ? "TEMPO · SUPPORT STANDBY" : `TEMPO ${Math.round(runtime.tempo)}`, x + 7, y + 9);
}
