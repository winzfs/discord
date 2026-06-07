import {
  craftMythicHero,
  gambleSummonFromPool,
  getRunBoostEffect,
  getSummonCost,
  summonHeroFromPool,
} from "@discord-random-defense/game";
import type { BoardHero, GameState } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import { createPixiMythicMenuView } from "./pixiMythicMenuView";
import { createPixiGambleMenuView } from "./pixiGambleMenuView";
import { showRunBoostMenu } from "./pixiRunBoostRuntime";
import { showUnitRevealFx } from "./pixiUnitRevealFxRuntime";

export type SummonButtonState = {
  cost: number;
  disabled: boolean;
  sub: string;
};

export type PixiControlActionRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
  clearMenuAndUnitInfo: (refs: GameRefs) => void;
  getSummonButtonState: (state: GameState) => SummonButtonState;
  getCellIndexFromHero: (state: GameState, hero: BoardHero | null) => number | null;
  render: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

function getSummonDiscountCredit(state: GameState) {
  const baseCost = getSummonCost(state.summonCount);
  const discount = Math.min(0.45, getRunBoostEffect("summon", state.runBoosts?.summon ?? 0));
  const discountedCost = Math.max(1, Math.ceil(baseCost * (1 - discount)));
  return Math.max(0, baseCost - discountedCost);
}

export function summonAction(refs: GameRefs, options: PixiControlActionRuntimeOptions) {
  options.clearMenuAndUnitInfo(refs);

  const summonState = options.getSummonButtonState(refs.state);

  if (summonState.disabled || refs.movementLocked) {
    options.floatText(
      refs,
      summonState.sub,
      refs.app.renderer.width / 2,
      refs.app.renderer.height - 140,
      colors.red,
    );
    return;
  }

  const summonCredit = getSummonDiscountCredit(refs.state);
  const result = summonHeroFromPool(
    {
      ...refs.state,
      resources: refs.state.resources + summonCredit,
    },
    refs.random,
    refs.heroPool,
  );
  refs.state = result.state;
  refs.lastSummonedIndex = options.getCellIndexFromHero(refs.state, result.summonedHero);

  options.render(refs);
  showUnitRevealFx(refs, result.summonedHero, "summon");
  options.floatText(
    refs,
    result.summonedHero ? "소환!" : "실패",
    refs.app.renderer.width / 2,
    refs.app.renderer.height - 140,
    result.summonedHero ? colors.yellow : colors.red,
  );
}

function runGambleAction(refs: GameRefs, tierId: "epic-gamble" | "legendary-gamble", options: PixiControlActionRuntimeOptions) {
  options.clearMenu(refs);

  if (refs.movementLocked) return;

  const result = gambleSummonFromPool(refs.state, tierId, refs.random, refs.heroPool);

  if (!result.summonedHero) {
    const message =
      result.reason === "not_enough_luck_stones"
        ? "행운석 부족"
        : result.reason === "board_full"
          ? "보드 가득"
          : "도박 실패";

    options.floatText(
      refs,
      message,
      refs.app.renderer.width / 2,
      refs.app.renderer.height - 140,
      colors.red,
    );
    return;
  }

  refs.state = result.state;
  refs.lastSummonedIndex = options.getCellIndexFromHero(refs.state, result.summonedHero);

  options.render(refs);
  showUnitRevealFx(refs, result.summonedHero, "gamble");
  options.floatText(
    refs,
    result.success ? (tierId === "legendary-gamble" ? "전설 도박 성공!" : "도박 성공!") : "보정 소환",
    refs.app.renderer.width / 2,
    refs.app.renderer.height - 140,
    result.success ? colors.yellow : colors.blue,
  );
}

export function gambleAction(refs: GameRefs, options: PixiControlActionRuntimeOptions) {
  options.clearMenuAndUnitInfo(refs);

  if (refs.movementLocked) return;

  const menu = createPixiGambleMenuView({
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    luckStones: refs.state.luckStones,
    onClose: () => options.clearMenu(refs),
    onCoinGamble: () => runGambleAction(refs, "epic-gamble", options),
    onLegendaryGamble: () => runGambleAction(refs, "legendary-gamble", options),
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

export function attackUpgradeAction(refs: GameRefs, options: PixiControlActionRuntimeOptions) {
  if (refs.movementLocked) return;
  showRunBoostMenu(refs, options);
}

export function showMythicMenu(refs: GameRefs, options: PixiControlActionRuntimeOptions) {
  options.clearMenu(refs);

  const menu = createPixiMythicMenuView({
    state: refs.state,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    onClose: () => options.clearMenu(refs),
    onCraft: (recipeId) => mythicCraftAction(refs, recipeId, options),
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

export function mythicCraftAction(
  refs: GameRefs,
  recipeId: string,
  options: PixiControlActionRuntimeOptions,
) {
  options.clearMenu(refs);

  const result = craftMythicHero(refs.state, recipeId);

  if (!result.craftedHero) {
    options.floatText(
      refs,
      "조합 재료 부족",
      refs.app.renderer.width / 2,
      refs.app.renderer.height * 0.56,
      colors.red,
    );
    return;
  }

  refs.state = result.state;
  refs.lastSummonedIndex = options.getCellIndexFromHero(refs.state, result.craftedHero);

  options.render(refs);
  showUnitRevealFx(refs, result.craftedHero, "mythic");
  options.floatText(
    refs,
    "신화 조합 완성!",
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.52,
    colors.yellow,
  );
}
