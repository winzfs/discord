import type { BoardHero } from "@discord-random-defense/game";
import type { GameRefs } from "./pixiGameTypes";
import { clearPixiUnitInfoView, drawPixiUnitInfoView } from "./pixiUnitInfoView";
import { clearPixiUnitRangePreview, drawPixiUnitRangePreview } from "./pixiUnitRangeView";
import { getHeroSynergyAttackMultiplier } from "./pixiHeroSynergyRuntime";
import { getProgressHeroMasteryEffect } from "./pixiProgressBonuses";

export type PixiSelectionRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
};

function buildTraitLines(refs: GameRefs, hero: BoardHero) {
  const lines: string[] = [];
  const synergyMultiplier = getHeroSynergyAttackMultiplier(refs, hero);
  const mastery = getProgressHeroMasteryEffect(refs.progressBonuses, hero.heroId);

  if (synergyMultiplier > 1.001) {
    lines.push(`연계 효과: 주변/지휘 지원으로 공격 +${Math.round((synergyMultiplier - 1) * 100)}%`);
  }

  if (mastery.level > 1) {
    lines.push(`숙련 Lv.${mastery.level}: 스킬 +${Math.round((mastery.skillMultiplier - 1) * 100)}%, 제어 +${Math.round((mastery.controlMultiplier - 1) * 100)}%`);
  }

  return lines;
}

export function clearUnitSelection(refs: GameRefs) {
  refs.selectedCellIndex = null;
  clearPixiUnitInfoView(refs.info);
  clearPixiUnitRangePreview(refs);
}

export function drawSelectedUnitInfo(refs: GameRefs) {
  if (refs.selectedCellIndex === null) {
    clearPixiUnitInfoView(refs.info);
    clearPixiUnitRangePreview(refs);
    return;
  }

  const cell = refs.state.board[refs.selectedCellIndex];
  const hero = cell?.units[cell.units.length - 1];

  if (!cell || !hero) {
    clearUnitSelection(refs);
    return;
  }

  drawPixiUnitRangePreview(refs, refs.selectedCellIndex, hero);
  drawPixiUnitInfoView(refs.info, {
    hero,
    stackCount: cell.units.length,
    cellIndex: refs.selectedCellIndex,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    traitLines: buildTraitLines(refs, hero),
  });
}

export function clearMenuAndUnitInfo(refs: GameRefs, options: PixiSelectionRuntimeOptions) {
  options.clearMenu(refs);
  clearUnitSelection(refs);
}
