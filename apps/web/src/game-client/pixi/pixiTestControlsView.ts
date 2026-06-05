import { Container, Graphics, Text } from "pixi.js";
import { getHeroById } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import type { GameRefs } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import {
  pixiTestEnemyHpMultipliers,
  pixiTestMythicHeroIds,
  setPixiTestEnemyHpMultiplier,
  summonPixiTestMythicHero,
} from "./pixiTestControlsRuntime";

export type PixiTestControlsView = {
  root: Container;
  lastKey: string;
};

function makeText(value: string, size = 11, fill: number = colors.white) {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: "bold",
      stroke: { color: colors.black, width: 2 },
    },
  });
}

function makeButton(label: string, width: number, height: number, color: number, onTap: () => void) {
  const root = new Container();
  const background = new Graphics();
  const text = makeText(label, 11, colors.white);

  background.roundRect(0, 0, width, height, 8);
  background.fill({ color, alpha: 0.94 });
  background.stroke({ color: colors.black, width: 2, alpha: 0.35 });

  text.anchor.set(0.5);
  text.x = width / 2;
  text.y = height / 2;

  root.addChild(background, text);
  root.eventMode = "static";
  root.cursor = "pointer";
  root.on("pointertap", () => {
    root.scale.set(0.96);
    window.setTimeout(() => root.scale.set(1), 80);
    onTap();
  });

  return root;
}

function drawPanel(width: number, height: number) {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, 12);
  panel.fill({ color: 0x1d2430, alpha: 0.76 });
  panel.stroke({ color: 0xffffff, width: 1, alpha: 0.16 });
  return panel;
}

export function createPixiTestControlsView(parent: Container) {
  const view: PixiTestControlsView = {
    root: new Container(),
    lastKey: "",
  };

  parent.addChild(view.root);
  return view;
}

export function updatePixiTestControlsView(view: PixiTestControlsView, refs: GameRefs, layout: GameLayout, force = false) {
  const key = `${layout.width}|${layout.height}|${refs.testEnemyHpMultiplier}`;
  if (!force && view.lastKey === key) return;
  view.lastKey = key;
  view.root.removeChildren();

  const panelWidth = Math.min(layout.width - 24, 390);
  const buttonWidth = 68;
  const buttonHeight = 28;
  const gap = 6;
  const panelHeight = 150;

  view.root.x = 12;
  view.root.y = layout.mapTop + 10;
  view.root.addChild(drawPanel(panelWidth, panelHeight));

  const title = makeText("신화 실험실", 13, colors.yellow);
  title.x = 12;
  title.y = 8;
  view.root.addChild(title);

  pixiTestMythicHeroIds.forEach((heroId, index) => {
    const hero = getHeroById(heroId);
    const label = hero?.displayName ?? heroId;
    const x = 12 + (index % 5) * (buttonWidth + gap);
    const y = 32 + Math.floor(index / 5) * (buttonHeight + gap);
    view.root.addChild(
      makeButton(label, buttonWidth, buttonHeight, colors.orange, () => {
        const placed = summonPixiTestMythicHero(refs, heroId);
        if (placed) {
          refs.selectedCellIndex = placed.position.row * refs.state.boardSize.columns + placed.position.column;
        }
      }),
    );
  });

  const hpLabel = makeText(`몬스터 HP x${refs.testEnemyHpMultiplier}`, 12, colors.white);
  hpLabel.x = 12;
  hpLabel.y = 104;
  view.root.addChild(hpLabel);

  pixiTestEnemyHpMultipliers.forEach((multiplier, index) => {
    const selected = refs.testEnemyHpMultiplier === multiplier;
    const x = 112 + index * 48;
    const y = 100;
    view.root.addChild(
      makeButton(`x${multiplier}`, 42, 28, selected ? colors.green : colors.blue, () => {
        setPixiTestEnemyHpMultiplier(refs, multiplier);
        view.lastKey = "";
      }),
    );
  });
}
