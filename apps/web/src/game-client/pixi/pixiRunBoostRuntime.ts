import { applyRunChoice } from "@discord-random-defense/game";
import type { RunBoostId } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { createPixiRunBoostMenuView } from "./pixiRunBoostMenuView";

export type PixiRunBoostRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
  clearMenuAndUnitInfo: (refs: GameRefs) => void;
  render: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

export function showRunBoostMenu(refs: GameRefs, options: PixiRunBoostRuntimeOptions) {
  options.clearMenuAndUnitInfo(refs);
  options.clearMenu(refs);

  const menu = createPixiRunBoostMenuView({
    state: refs.state,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    onClose: () => options.clearMenu(refs),
    onSelect: (boostId) => runBoostAction(refs, boostId, options),
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

export function runBoostAction(refs: GameRefs, boostId: RunBoostId, options: PixiRunBoostRuntimeOptions) {
  const result = applyRunChoice(refs.state, boostId);

  if (!result.applied) {
    const message = result.reason === "max_level" ? "최대 레벨" : result.reason === "not_enough_resources" ? `코인 부족 ${result.cost}` : "강화 불가";
    options.floatText(refs, message, refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.red);
    return;
  }

  refs.state = result.state;
  options.clearMenu(refs);
  options.render(refs);
  options.floatText(refs, "강화 완료!", refs.app.renderer.width / 2, refs.app.renderer.height * 0.56, colors.yellow);
}
