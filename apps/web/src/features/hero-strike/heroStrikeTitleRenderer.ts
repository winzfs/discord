import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { drawHeroStrikeLobbyBackdrop } from "./heroStrikeLobbyBackdropRenderer";
import { getHeroStrikeLobbySnapshot } from "./heroStrikeLobbyData";
import { drawHeroStrikeTitlePanels } from "./heroStrikeTitlePanelsRenderer";
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

export function drawHeroStrikeTitle(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const snapshot = getHeroStrikeLobbySnapshot(state);
  drawHeroStrikeLobbyBackdrop(ctx, state);

  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "1000 9px system-ui";
  ctx.fillText("MISSION SHOOTER ROGUELITE", 24, 80);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "1000 42px system-ui";
  ctx.fillText("HERO", 24, 126);
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.fillText("STRIKE", 24, 166);
  ctx.fillStyle = HERO_STRIKE_COLORS.muted;
  ctx.font = "800 9px system-ui";
  ctx.fillText("READ THE ATTACK · COMPLETE THE MISSION", 24, 187);
  ctx.fillText("BUILD THE LOADOUT · BREAK THE BOSS", 24, 203);

  roundedRect(ctx, 82, 642, 256, 62, 18);
  const button = ctx.createLinearGradient(82, 0, 338, 0);
  button.addColorStop(0, HERO_STRIKE_COLORS.orange);
  button.addColorStop(1, HERO_STRIKE_COLORS.gold);
  ctx.fillStyle = button;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.4)";
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#111827";
  ctx.font = "1000 17px system-ui";
  ctx.fillText("ENTER COMMAND DECK", HERO_STRIKE_WIDTH / 2, 676);
  ctx.fillStyle = "rgba(17,24,39,.68)";
  ctx.font = "900 7px system-ui";
  ctx.fillText(`${snapshot.mission.operationCode} · ${snapshot.mission.name} READY`, HERO_STRIKE_WIDTH / 2, 692);

  drawHeroStrikeTitlePanels(ctx, state, snapshot);
  ctx.textAlign = "left";
}
