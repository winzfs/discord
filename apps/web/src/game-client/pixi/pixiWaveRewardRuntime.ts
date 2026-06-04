import { initialBalance } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import type { GameRefs } from "./pixiGameTypes";
import {
  createPixiWaveRewardMenuView,
  type WaveRewardChoice,
  type WaveRewardChoiceId,
} from "./pixiWaveRewardMenuView";

export type PixiWaveRewardRuntimeOptions = {
  clearMenu: (refs: GameRefs) => void;
  render: (refs: GameRefs) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

export function shouldOfferWaveReward(refs: GameRefs) {
  if (refs.state.status !== "playing") return false;
  if (!refs.lastWaveSummary) return false;
  const clearedWave = Math.max(1, refs.state.currentWave - 1);
  return refs.lastWaveSummary.perfect || clearedWave % 3 === 0 || clearedWave % initialBalance.bossWaveInterval === 0;
}

function createWaveRewardChoices(refs: GameRefs): WaveRewardChoice[] {
  const clearedWave = Math.max(1, refs.state.currentWave - 1);
  const coinValue = 18 + clearedWave * 3;
  const healValue = Math.max(3, Math.floor(initialBalance.startingLives * 0.08));

  return [
    {
      id: "coins",
      title: "코인 보급",
      description: "즉시 코인을 획득합니다.",
      value: coinValue,
    },
    {
      id: "luck",
      title: "행운석 충전",
      description: "도박과 신화 조합에 사용할 행운석을 얻습니다.",
      value: 1,
    },
    {
      id: "heal",
      title: "코어 수리",
      description: "잃은 체력을 일부 회복합니다.",
      value: healValue,
    },
  ];
}

export function showWaveRewardMenu(refs: GameRefs, options: PixiWaveRewardRuntimeOptions) {
  if (!shouldOfferWaveReward(refs)) return;

  options.clearMenu(refs);

  const menu = createPixiWaveRewardMenuView({
    choices: createWaveRewardChoices(refs),
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    onSelect: (choiceId) => applyWaveReward(refs, choiceId, options),
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}

export function applyWaveReward(
  refs: GameRefs,
  choiceId: WaveRewardChoiceId,
  options: PixiWaveRewardRuntimeOptions,
) {
  const choices = createWaveRewardChoices(refs);
  const choice = choices.find((item) => item.id === choiceId);
  if (!choice) return;

  if (choice.id === "coins") {
    refs.state = {
      ...refs.state,
      resources: refs.state.resources + choice.value,
    };
  }

  if (choice.id === "luck") {
    refs.state = {
      ...refs.state,
      luckStones: refs.state.luckStones + choice.value,
    };
  }

  if (choice.id === "heal") {
    refs.state = {
      ...refs.state,
      lives: Math.min(initialBalance.startingLives, refs.state.lives + choice.value),
    };
  }

  options.clearMenu(refs);
  options.render(refs);
  options.floatText(
    refs,
    `${choice.title} +${choice.value}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.42,
    colors.yellow,
  );
}
