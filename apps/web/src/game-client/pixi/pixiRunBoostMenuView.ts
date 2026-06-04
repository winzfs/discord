import { Container, Graphics, Rectangle } from "pixi.js";
import type { GameState, RunBoostId } from "@discord-random-defense/game";
import { getRunBoostCost, getRunBoostEffect, runBoosts } from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { makePixiText } from "./pixiSharedView";

export type PixiRunBoostMenuOptions = {
  state: GameState;
  rendererWidth: number;
  rendererHeight: number;
  onClose: () => void;
  onSelect: (boostId: RunBoostId) => void;
};

const mutedText = 0xb8aaa0;

const labels: Record<RunBoostId, { name: string; desc: string }> = {
  attack: { name: "공격 강화", desc: "이번 판 전체 피해 증가" },
  economy: { name: "경제 강화", desc: "처치 코인 보상 증가" },
  summon: { name: "소환 강화", desc: "소환 비용 감소" },
  luck: { name: "행운 강화", desc: "완벽 방어 보상 강화" },
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function createPixiRunBoostMenuView(options: PixiRunBoostMenuOptions) {
  const root = new Container();
  root.zIndex = 50;

  const overlay = new Graphics();
  overlay.rect(0, 0, options.rendererWidth, options.rendererHeight);
  overlay.fill({ color: 0x000000, alpha: 0.48 });
  overlay.eventMode = "static";
  overlay.cursor = "pointer";
  overlay.hitArea = new Rectangle(0, 0, options.rendererWidth, options.rendererHeight);
  overlay.on("pointertap", options.onClose);
  root.addChild(overlay);

  const width = Math.min(420, options.rendererWidth - 28);
  const x = (options.rendererWidth - width) / 2;
  const y = Math.max(76, options.rendererHeight * 0.18);

  const panel = new Graphics();
  panel.roundRect(x, y, width, 360, 20);
  panel.fill({ color: colors.panel, alpha: 0.96 });
  panel.stroke({ color: colors.panelDark, width: 4 });
  root.addChild(panel);

  const title = makePixiText("이번 판 강화", 22, colors.white);
  title.anchor.set(0.5);
  title.x = options.rendererWidth / 2;
  title.y = y + 30;
  root.addChild(title);

  const subtitle = makePixiText("코인을 사용해 이번 판만 적용되는 효과를 고르세요", 13, mutedText);
  subtitle.anchor.set(0.5);
  subtitle.x = options.rendererWidth / 2;
  subtitle.y = y + 56;
  root.addChild(subtitle);

  runBoosts.forEach((boost, index) => {
    const level = options.state.runBoosts?.[boost.id] ?? 0;
    const cost = getRunBoostCost(boost.id, level);
    const disabled = options.state.resources < cost || level >= boost.maxLevel;
    const rowY = y + 82 + index * 66;
    const label = labels[boost.id];

    const button = new Graphics();
    button.roundRect(x + 16, rowY, width - 32, 54, 14);
    button.fill({ color: disabled ? 0x3f3634 : 0x5a463f, alpha: 1 });
    button.stroke({ color: disabled ? 0x5f514d : colors.yellow, width: disabled ? 1 : 2 });
    button.eventMode = disabled ? "none" : "static";
    button.cursor = disabled ? "default" : "pointer";
    button.hitArea = new Rectangle(x + 16, rowY, width - 32, 54);
    if (!disabled) button.on("pointertap", () => options.onSelect(boost.id));
    root.addChild(button);

    const name = makePixiText(`${label.name} Lv.${level}`, 16, colors.white);
    name.x = x + 30;
    name.y = rowY + 8;
    root.addChild(name);

    const desc = makePixiText(`${label.desc} / 현재 +${formatPercent(getRunBoostEffect(boost.id, level))}`, 11, mutedText);
    desc.x = x + 30;
    desc.y = rowY + 30;
    root.addChild(desc);

    const price = makePixiText(level >= boost.maxLevel ? "MAX" : `${cost}C`, 15, disabled ? mutedText : colors.yellow);
    price.anchor.set(1, 0.5);
    price.x = x + width - 30;
    price.y = rowY + 27;
    root.addChild(price);
  });

  return root;
}
