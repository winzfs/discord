import { Container, Graphics, Rectangle } from "pixi.js";
import { colors } from "./gameTheme";
import { makePixiText } from "./pixiSharedView";

export type WaveRewardChoiceId = "coins" | "luck" | "heal";

export type WaveRewardChoice = {
  id: WaveRewardChoiceId;
  title: string;
  description: string;
  value: number;
};

export type PixiWaveRewardMenuOptions = {
  choices: WaveRewardChoice[];
  rendererWidth: number;
  rendererHeight: number;
  onSelect: (choiceId: WaveRewardChoiceId) => void;
};

const mutedText = 0xb8aaa0;

export function createPixiWaveRewardMenuView(options: PixiWaveRewardMenuOptions) {
  const root = new Container();
  root.zIndex = 55;

  const overlay = new Graphics();
  overlay.rect(0, 0, options.rendererWidth, options.rendererHeight);
  overlay.fill({ color: 0x000000, alpha: 0.42 });
  overlay.eventMode = "static";
  overlay.hitArea = new Rectangle(0, 0, options.rendererWidth, options.rendererHeight);
  root.addChild(overlay);

  const width = Math.min(430, options.rendererWidth - 28);
  const x = (options.rendererWidth - width) / 2;
  const y = Math.max(88, options.rendererHeight * 0.2);

  const panel = new Graphics();
  panel.roundRect(x, y, width, 300, 20);
  panel.fill({ color: colors.panel, alpha: 0.97 });
  panel.stroke({ color: colors.yellow, width: 3 });
  root.addChild(panel);

  const title = makePixiText("웨이브 보상 선택", 22, colors.white);
  title.anchor.set(0.5);
  title.x = options.rendererWidth / 2;
  title.y = y + 32;
  root.addChild(title);

  const subtitle = makePixiText("다음 웨이브를 위한 보상 하나를 고르세요", 13, mutedText);
  subtitle.anchor.set(0.5);
  subtitle.x = options.rendererWidth / 2;
  subtitle.y = y + 58;
  root.addChild(subtitle);

  options.choices.forEach((choice, index) => {
    const rowY = y + 86 + index * 62;
    const button = new Graphics();
    button.roundRect(x + 18, rowY, width - 36, 52, 14);
    button.fill({ color: 0x59463e, alpha: 1 });
    button.stroke({ color: colors.panelDark, width: 2 });
    button.eventMode = "static";
    button.cursor = "pointer";
    button.hitArea = new Rectangle(x + 18, rowY, width - 36, 52);
    button.on("pointertap", () => options.onSelect(choice.id));
    root.addChild(button);

    const name = makePixiText(choice.title, 16, colors.white);
    name.x = x + 34;
    name.y = rowY + 8;
    root.addChild(name);

    const desc = makePixiText(choice.description, 12, mutedText);
    desc.x = x + 34;
    desc.y = rowY + 30;
    root.addChild(desc);

    const value = makePixiText(`+${choice.value}`, 16, colors.yellow);
    value.anchor.set(1, 0.5);
    value.x = x + width - 34;
    value.y = rowY + 26;
    root.addChild(value);
  });

  return root;
}
