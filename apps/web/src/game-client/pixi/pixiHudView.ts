import { Container, Graphics, Text } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { drawGamePanel, drawSegmentedBar } from "./pixiGameUiPrimitives";

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
  firepowerChip: Graphics;
  unitsChip: Graphics;
  coinChip: Graphics;
  luckChip: Graphics;
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
      dropShadow: {
        color: 0x000000,
        alpha: 0.35,
        blur: 0,
        distance: 2,
        angle: Math.PI / 2,
      },
    },
  });
}

function drawChip(graphics: Graphics, x: number, y: number, width: number, height: number, fill: number) {
  graphics.clear();
  graphics.roundRect(x + 3, y + 5, width, height, height / 2);
  graphics.fill({ color: 0x000000, alpha: 0.22 });
  graphics.roundRect(x, y, width, height, height / 2);
  graphics.fill({ color: fill, alpha: 0.92 });
  graphics.stroke({ color: 0x2d1b18, width: 3, alpha: 0.9 });
  graphics.roundRect(x + 7, y + 4, Math.max(0, width - 14), Math.max(6, height * 0.32), height / 3);
  graphics.fill({ color: 0xffffff, alpha: 0.1 });
}

export function createPixiHudView(parent: Container): PixiHudView {
  const view: PixiHudView = {
    root: new Container(),
    waveBox: new Graphics(),
    waveText: makeText("WAVE 1", 18),
    timerText: makeText("NEXT 8s", 19),
    hpBackground: new Graphics(),
    hpFill: new Graphics(),
    hpText: makeText("100 / 100", 16),
    firepowerChip: new Graphics(),
    unitsChip: new Graphics(),
    coinChip: new Graphics(),
    luckChip: new Graphics(),
    firepowerText: makeText("화력 0", 14),
    unitsText: makeText("0 / 0", 14),
    coinText: makeText("코인 0", 15, colors.yellow),
    luckText: makeText("행운석 0", 15, colors.blue),
  };

  view.waveText.anchor.set(0.5, 0);
  view.timerText.anchor.set(0.5, 0);
  view.hpText.anchor.set(0.5, 0);
  view.unitsText.anchor.set(0.5, 0);

  view.root.addChild(
    view.waveBox,
    view.waveText,
    view.timerText,
    view.hpBackground,
    view.hpFill,
    view.hpText,
    view.firepowerChip,
    view.unitsChip,
    view.coinChip,
    view.luckChip,
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
  view.firepowerChip.clear();
  view.unitsChip.clear();
  view.coinChip.clear();
  view.luckChip.clear();
}

export function updatePixiHudView(view: PixiHudView, layout: GameLayout, snapshot: HudSnapshot) {
  const boss = snapshot.isBossWave;
  const waveWidth = 164;
  const waveHeight = 60;
  const waveX = layout.width / 2 - waveWidth / 2;
  const waveY = layout.topHudY;
  drawGamePanel(view.waveBox, waveX, waveY, waveWidth, waveHeight, 15, boss ? 0x6b2630 : 0x624635, boss ? colors.red : 0x30231d);

  view.waveText.text = boss ? `BOSS WAVE ${snapshot.currentWave}` : `WAVE ${snapshot.currentWave}`;
  view.waveText.x = layout.width / 2;
  view.waveText.y = waveY + 8;
  view.waveText.style.fill = boss ? 0xffd7d7 : colors.white;

  const timerLabel = snapshot.wavePhase === "combat" ? `${Math.ceil(snapshot.combatSeconds)}s` : snapshot.wavePhase === "result" ? "READY" : `${Math.ceil(snapshot.countdownSeconds)}s`;
  view.timerText.text = snapshot.wavePhase === "countdown" ? `NEXT ${timerLabel}` : timerLabel;
  view.timerText.x = layout.width / 2;
  view.timerText.y = waveY + 32;
  view.timerText.style.fill = boss ? 0xff6969 : colors.white;

  const hpWidth = layout.width - 78;
  const hpX = 39;
  const hpY = waveY + 70;
  const hpRatio = Math.max(0, Math.min(1, snapshot.lives / snapshot.maxLives));
  drawSegmentedBar(view.hpBackground, hpX, hpY, hpWidth, 28, hpRatio, boss ? 0xff5353 : colors.red, 0x52282e);
  view.hpFill.clear();

  view.hpText.text = `${snapshot.lives} / ${snapshot.maxLives}`;
  view.hpText.x = layout.width / 2;
  view.hpText.y = hpY + 4;

  const chipY = hpY + 42;
  drawChip(view.firepowerChip, 22, chipY, 104, 30, 0x3d3027);
  view.firepowerText.text = `화력 ${snapshot.firepower}`;
  view.firepowerText.x = 36;
  view.firepowerText.y = chipY + 5;

  drawChip(view.unitsChip, layout.width - 126, chipY, 104, 30, 0x3d3027);
  view.unitsText.text = `${snapshot.unitCount} / ${snapshot.unitCapacity}`;
  view.unitsText.x = layout.width - 74;
  view.unitsText.y = chipY + 5;

  const bottomChipY = layout.bottomY - 66;
  drawChip(view.luckChip, 22, bottomChipY, 118, 30, 0x223d48);
  view.luckText.text = `행운석 ${snapshot.luckStones}`;
  view.luckText.x = 34;
  view.luckText.y = bottomChipY + 5;

  drawChip(view.coinChip, 22, bottomChipY + 34, 106, 30, 0x4f3d1e);
  view.coinText.text = `코인 ${snapshot.resources}`;
  view.coinText.x = 34;
  view.coinText.y = bottomChipY + 39;
}
