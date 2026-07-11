import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import type { HeroStrikeState } from "./heroStrikeTypes";

function difficultyLabel(state: HeroStrikeState) {
  if (state.loadout.difficulty === "recruit") return "RECRUIT";
  if (state.loadout.difficulty === "legend") return "LEGEND";
  return "AGENT";
}

export function drawHeroStrikeGrowthHud(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  if (state.phase !== "playing") return;
  const protocolCount = Object.values(state.protocolLevels).filter((level) => (level ?? 0) > 0).length;
  ctx.textAlign = "right";
  ctx.fillStyle = state.loadout.difficulty === "legend" ? HERO_STRIKE_COLORS.red : HERO_STRIKE_COLORS.cyan;
  ctx.font = "800 8px system-ui";
  ctx.fillText(
    `${difficultyLabel(state)} · R${state.combatRank} · P${protocolCount} · LAB${state.researchRank}`,
    HERO_STRIKE_WIDTH - 28,
    77,
  );
  ctx.textAlign = "left";
}
