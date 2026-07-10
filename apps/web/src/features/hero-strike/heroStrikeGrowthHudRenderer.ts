import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeGrowthHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase === "title") return;
  const protocolCount = Object.values(state.protocolLevels).filter((level) => (level ?? 0) > 0).length;
  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "800 10px system-ui";
  ctx.fillText(`RANK ${state.combatRank} · PROTOCOL ${protocolCount}`, HERO_STRIKE_WIDTH - 20, 112);
  ctx.textAlign = "left";
}