import { drawHeroStrikeLobbyBackdrop } from "./heroStrikeLobbyBackdropRenderer";
import { drawHeroStrikeLobbyBuildProfile } from "./heroStrikeLobbyBuildProfileRenderer";
import { getHeroStrikeLobbyCategory, getHeroStrikeLobbySnapshot } from "./heroStrikeLobbyData";
import { drawHeroStrikeLobbyFooter } from "./heroStrikeLobbyFooterRenderer";
import { drawHeroStrikeLobbyOptions } from "./heroStrikeLobbyOptionsRenderer";
import { drawHeroStrikeLobbyOverview } from "./heroStrikeLobbyOverviewRenderer";
import { getHeroStrikeLobbyTab } from "./heroStrikeLobbyRuntime";
import type { HeroStrikeState } from "./heroStrikeTypes";

export function drawHeroStrikeLoadout(ctx: CanvasRenderingContext2D, state: HeroStrikeState) {
  const activeTab = getHeroStrikeLobbyTab(state);
  const snapshot = getHeroStrikeLobbySnapshot(state);
  const category = getHeroStrikeLobbyCategory(state, activeTab);

  drawHeroStrikeLobbyBackdrop(ctx, state);
  drawHeroStrikeLobbyOverview(ctx, snapshot);
  drawHeroStrikeLobbyOptions(ctx, category);
  drawHeroStrikeLobbyFooter(ctx, state, snapshot);
  drawHeroStrikeLobbyBuildProfile(ctx, state);
}
