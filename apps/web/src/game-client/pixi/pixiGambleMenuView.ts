import { Container, Graphics } from "pixi.js";
import { getGambleTier } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { makePixiPanel, makePixiText } from "./pixiSharedView";
import { makePixiTouchBoundary, stopPixiPropagation } from "./pixiPointerGuards";

export type PixiGambleMenuViewOptions = {
  rendererWidth: number;
  rendererHeight: number;
  luckStones: number;
  onClose: () => void;
  onCoinGamble: () => void;
  onLegendaryGamble: () => void;
};

function createGambleOption(args: {
  title: string;
  subtitle: string;
  cost: string;
  x: number;
  y: number;
  width: number;
  fill: number;
  disabled?: boolean;
  onTap: () => void;
}) {
  const root = new Container();
  root.x = args.x;
  root.y = args.y;
  root.eventMode = "static";
  root.cursor = args.disabled ? "default" : "pointer";

  const bg = new Graphics();
  bg.roundRect(0, 0, args.width, 72, 16);
  bg.fill({ color: args.disabled ? 0x5d5751 : args.fill, alpha: args.disabled ? 0.72 : 0.94 });
  bg.stroke({ color: 0x211812, width: 3, alpha: 0.9 });

  const title = makePixiText(args.title, 16, colors.white);
  title.x = 14;
  title.y = 10;

  const subtitle = makePixiText(args.subtitle, 11, 0xfff1d0);
  subtitle.x = 14;
  subtitle.y = 35;

  const cost = makePixiText(args.cost, 12, args.disabled ? 0xff9aa5 : colors.yellow);
  cost.anchor.set(1, 0);
  cost.x = args.width - 14;
  cost.y = 11;

  root.addChild(bg, title, subtitle, cost);
  root.on("pointerdown", stopPixiPropagation);
  root.on("pointerup", stopPixiPropagation);
  root.on("pointertap", (event: any) => {
    event.stopPropagation();
    if (args.disabled) return;
    args.onTap();
  });

  return root;
}

function createCloseButton(x: number, y: number, onTap: () => void) {
  const root = new Container();
  root.x = x;
  root.y = y;
  root.eventMode = "static";
  root.cursor = "pointer";
  root.addChild(makePixiPanel(58, 28, 0x51443a, colors.orange, 9));

  const text = makePixiText("닫기", 12, colors.white);
  text.anchor.set(0.5);
  text.x = 29;
  text.y = 14;
  root.addChild(text);

  root.on("pointerdown", stopPixiPropagation);
  root.on("pointerup", stopPixiPropagation);
  root.on("pointertap", (event: any) => {
    event.stopPropagation();
    onTap();
  });

  return root;
}

export function createPixiGambleMenuView(options: PixiGambleMenuViewOptions) {
  const width = Math.min(360, options.rendererWidth - 28);
  const height = 260;
  const menu = new Container();
  menu.x = options.rendererWidth / 2 - width / 2;
  menu.y = Math.max(42, options.rendererHeight * 0.22);
  makePixiTouchBoundary(menu, width, height);

  menu.addChild(makePixiPanel(width, height, 0x2d2925, colors.orange, 16));

  const title = makePixiText("도박 선택", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 15;
  menu.addChild(title);
  menu.addChild(createCloseButton(width - 70, 13, options.onClose));

  const luck = makePixiText(`보유 행운석 ${options.luckStones}`, 13, 0x9ed8ff);
  luck.anchor.set(0.5, 0);
  luck.x = width / 2;
  luck.y = 48;
  menu.addChild(luck);

  const epicTier = getGambleTier("epic-gamble");
  const legendaryTier = getGambleTier("legendary-gamble");
  const optionWidth = width - 32;

  menu.addChild(
    createGambleOption({
      title: "코인 도박",
      subtitle: `성공 시 영웅, 실패해도 희귀 획득 · 확률 ${Math.round((epicTier?.successRate ?? 0) * 100)}%`,
      cost: `행운석 ${epicTier?.costLuckStones ?? 2}`,
      x: 16,
      y: 78,
      width: optionWidth,
      fill: 0x356d92,
      disabled: options.luckStones < (epicTier?.costLuckStones ?? 2),
      onTap: options.onCoinGamble,
    }),
  );

  menu.addChild(
    createGambleOption({
      title: "전설 도박",
      subtitle: `성공 시 전설, 실패해도 영웅 획득 · 확률 ${Math.round((legendaryTier?.successRate ?? 0) * 100)}%`,
      cost: `행운석 ${legendaryTier?.costLuckStones ?? 4}`,
      x: 16,
      y: 160,
      width: optionWidth,
      fill: 0x7a5528,
      disabled: options.luckStones < (legendaryTier?.costLuckStones ?? 4),
      onTap: options.onLegendaryGamble,
    }),
  );

  return menu;
}
