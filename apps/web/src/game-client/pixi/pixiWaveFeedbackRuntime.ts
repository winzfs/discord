import { colors } from "./gameTheme";
import type { GameRefs, WaveSummary } from "./pixiGameTypes";
import { makePixiText } from "./pixiSharedView";

export type PixiWaveFeedbackRuntimeOptions = {
  addAnimation: (
    refs: GameRefs,
    animation: {
      duration: number;
      update: (progress: number) => void;
      done?: () => void;
    },
  ) => void;
  floatText: (refs: GameRefs, value: string, x: number, y: number, color: number) => void;
};

export function showBossWarning(refs: GameRefs, options: PixiWaveFeedbackRuntimeOptions) {
  const warning = makePixiText("⚠ BOSS WAVE ⚠", 32, colors.red);
  warning.anchor.set(0.5);
  warning.x = refs.app.renderer.width / 2;
  warning.y = refs.app.renderer.height * 0.26;

  refs.effects.addChild(warning);

  options.addAnimation(refs, {
    duration: 1350,
    update: (progress) => {
      warning.alpha = Math.sin(progress * Math.PI * 6) > 0 ? 1 : 0.35;
      warning.scale.set(1 + Math.sin(progress * Math.PI) * 0.28);
    },
    done: () => warning.destroy(),
  });
}

export function showWaveResult(
  refs: GameRefs,
  summary: WaveSummary,
  options: PixiWaveFeedbackRuntimeOptions,
) {
  const label =
    refs.state.status === "failed"
      ? `패배... -${summary.lostLives} HP`
      : summary.leaked > 0
        ? `누수 ${summary.leaked}마리  -${summary.lostLives} HP`
        : "완벽 방어!";

  const color =
    refs.state.status === "failed"
      ? colors.red
      : summary.leaked > 0
        ? colors.orange
        : colors.green;

  options.floatText(refs, label, refs.app.renderer.width / 2, refs.app.renderer.height * 0.38, color);
  options.floatText(
    refs,
    `처치 ${summary.killed} / 누수 ${summary.leaked}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height * 0.46,
    colors.white,
  );
  options.floatText(
    refs,
    `처치 보상 +${summary.reward}${summary.luckStoneReward > 0 ? `  행운석 +${summary.luckStoneReward}` : ""}`,
    refs.app.renderer.width / 2,
    refs.app.renderer.height - 132,
    colors.green,
  );
}
