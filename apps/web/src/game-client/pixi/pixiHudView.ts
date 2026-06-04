import { Container, Graphics, Text } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";

export type HudWavePhase = "countdown" | "combat" | "result";

export type HudSnapshot = {
  currentWave: number;
  wavePhase: HudWavePhase;
  countdownSeconds: number;
  combatSeconds: number;
  lives: number;
  maxLives: number;
  firepower: number;
  unitCount: number;
  unitCapacity: number;
  resources: number;
  luckStones: number;
  isBossWave: boolean;
};

export type PixiHudView = {
  root: Container;
  waveBox: Graphics;
  waveText: Text;
  timerText: Text;
  hpBackground: Graphics;
  hpFill: Graphics;
  hpText: Text;
  firepowerText: Text;
  unitsText: Text;
  coinText: Text;
  luckText: Text;
};

function makeText(value: string, size = 18, fill: number = colors.white) {
  return new Text({
    text: value,
    style: {
      fill,
      fontFamily: "Arial, sans-serif",
      fontSize: size,
      fontWeight: "bold",
      stroke: { color: colors.black, width: size > 18 ? 4 : 2 },
    },
  });
}

function redrawRoundRect(graphics: Graphics, x: number, y: number, width: number, height: number, radius: number, fill: number, stroke?: number) {
  graphics.clear();
  graphics.roundRect(x, y, width, height, radius);
  graphics.fill({ color: fill, alpha: 1 });
  if (stroke !== undefined) graphics.stroke({ color: stroke, width: 3, alpha: 0.9 });
}

export function createPixiHudView(parent: Container): PixiHudView {
  const view: PixiHudView = {
    root: new Container(),
    waveBox: new Graphics(),
    waveText: makeText("WAVE 1", 18),
    timerText: makeText("NEXT 8s", 20),
    hpBackground: new Graphics(),
    hpFill: new Graphics(),
    hpText: makeText("100 / 100", 16),
    firepowerText: makeText("화력 0", 15),
    unitsText: makeText("0 / 0", 15),
    coinText: makeText("코인 0", 18, colors.yellow),
    luckText: makeText("행운석 0", 16, colors.blue),
  };

  view.waveText.anchor.set(0.5, 0);
  view.timerText.anchor.set(0.5, 0);
  view.hpText.anchor.set(0.5, 0);

  view.root.addChild(
    view.waveBox,
    view.waveText,
    view.timerText,
    view.hpBackground,
    view.hpFill,
    view.hpText,
    view.firepowerText,
    view.unitsText,
    view.coinText,
    view.luckText,
  );
  parent.addChild(view.root);
  return view;
}

export function invalidatePixiHudView(view: PixiHudView | null) {
  if (!view) return;
  view.waveBox.clear();
  view.hpBackground.clear();
  view.hpFill.clear();
}

export function updatePixiHudView(view: PixiHudView, layout: GameLayout, snapshot: HudSnapshot) {
  const boss = snapshot.isBossWave;
  redrawRoundRect(view.waveBox, layout.width / 2 - 75, layout.topHudY, 150, 58, 12, boss ? 0x5a2327 : colors.panel, boss ? colors.red : 0x3b2d26);

  view.waveText.text = `WAVE ${snapshot.currentWave}`;
  view.waveText.x = layout.width / 2;
  view.waveText.y = layout.topHudY + 7;
  view.waveText.style.fill = colors.white;

  const timerLabel = snapshot.wavePhase === "combat" ? `${Math.ceil(snapshot.combatSeconds)}s` : snapshot.wavePhase === "result" ? "READY" : `${Math.ceil(snapshot.countdownSeconds)}s`;
  view.timerText.text = boss ? `BOSS ${timerLabel}` : snapshot.wavePhase === "countdown" ? `NEXT ${timerLabel}` : timerLabel;
  view.timerText.x = layout.width / 2;
  view.timerText.y = layout.topHudY + 30;
  view.timerText.style.fill = boss ? colors.red : colors.white;

  redrawRoundRect(view.hpBackground, 46, layout.topHudY + 66, layout.width - 92, 24, 12, 0x4d2228, 0x2f1519);
  const hpRatio = Math.max(0, Math.min(1, snapshot.lives / snapshot.maxLives));
  redrawRoundRect(view.hpFill, 50, layout.topHudY + 70, (layout.width - 100) * hpRatio, 16, 8, colors.red);

  view.hpText.text = `${snapshot.lives} / ${snapshot.maxLives}`;
  view.hpText.x = layout.width / 2;
  view.hpText.y = layout.topHudY + 67;

  view.firepowerText.text = `화력 ${snapshot.firepower}`;
  view.firepowerText.x = 22;
  view.firepowerText.y = layout.topHudY + 98;

  view.unitsText.text = `${snapshot.unitCount} / ${snapshot.unitCapacity}`;
  view.unitsText.x = layout.width - 96;
  view.unitsText.y = layout.topHudY + 98;

  view.coinText.text = `코인 ${snapshot.resources}`;
  view.coinText.x = 24;
  view.coinText.y = layout.bottomY - 34;

  view.luckText.text = `행운석 ${snapshot.luckStones}`;
  view.luckText.x = 24;
  view.luckText.y = layout.bottomY - 58;
}
