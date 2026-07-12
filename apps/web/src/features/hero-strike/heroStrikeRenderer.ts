import { drawHeroStrikeCombatControl } from "./heroStrikeCombatControlRenderer";
import { drawHeroStrikeCombatProgress } from "./heroStrikeCombatProgressRenderer";
import { HERO_STRIKE_HEIGHT, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { drawHeroStrikeBackdrop } from "./heroStrikeBackdropRenderer";
import { drawHeroStrikeEnemyTelegraphs } from "./heroStrikeEnemyTelegraphRenderer";
import { drawHeroStrikeEntities } from "./heroStrikeEntityRenderer";
import { drawHeroStrikeHud } from "./heroStrikeHudRenderer";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function renderHeroStrike(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  ctx.save();
  const shake = state.shake > 0 ? state.shake * 8 : 0;
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.clearRect(-10, -10, HERO_STRIKE_WIDTH + 20, HERO_STRIKE_HEIGHT + 20);
  drawHeroStrikeBackdrop(ctx, state);
  drawHeroStrikeEnemyTelegraphs(ctx, state);
  drawHeroStrikeEntities(ctx, state);
  drawHeroStrikeCombatControl(ctx, state);
  drawHeroStrikeCombatProgress(ctx, state);
  drawHeroStrikeHud(ctx, state);
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.45, state.flash)})`;
    ctx.fillRect(0, 0, HERO_STRIKE_WIDTH, HERO_STRIKE_HEIGHT);
  }
  ctx.restore();
}
