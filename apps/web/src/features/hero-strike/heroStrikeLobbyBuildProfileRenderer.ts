import { HERO_STRIKE_COLORS } from "./heroStrikeConfig";
import { getHeroStrikeLobbyBuildProfile } from "./heroStrikeLobbyBuildProfile";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeLobbyBuildProfile(
  ctx: CanvasRenderingContext2D,
  state: HeroStrikeState,
) {
  const profile = getHeroStrikeLobbyBuildProfile(state.loadout);
  ctx.textAlign = "left";
  ctx.fillStyle = HERO_STRIKE_COLORS.orange;
  ctx.font = "1000 7px system-ui";
  ctx.fillText("BUILD PROFILE", 18, 640);
  ctx.fillStyle = HERO_STRIKE_COLORS.white;
  ctx.font = "900 8px system-ui";
  ctx.fillText(profile.title, 82, 640);

  let right = 402;
  ctx.textAlign = "right";
  for (const tag of [...profile.tags].reverse()) {
    ctx.font = "900 7px system-ui";
    const width = ctx.measureText(tag).width + 14;
    ctx.beginPath();
    ctx.roundRect(right - width, 629, width, 19, 7);
    ctx.fillStyle = "rgba(105,231,255,.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(105,231,255,.18)";
    ctx.stroke();
    ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
    ctx.fillText(tag, right - 7, 642);
    right -= width + 5;
  }
  ctx.textAlign = "left";
}
