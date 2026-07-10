import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeGrowthHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const protocolCount = Object.values(state.protocolLevels).filter((level) => (level ?? 0) > 0).length;
  ctx.textAlign = "right";
  ctx.fillStyle = HERO_STRIKE_COLORS.cyan;
  ctx.font = "800 8px system-ui";
  ctx.fillText(
    `R${state.combatRank} · P${protocolCount} · LAB${state.researchRank}`,
    HERO_STRIKE_WIDTH - 28,
    77,
  );
  ctx.textAlign = "left";
}
