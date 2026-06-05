import { Container, Graphics, Text } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { drawGamePanel, drawSegmentedBar } from "./pixiGameUiPrimitives";
import { makeGameText } from "./pixiTextStyles";

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
    waveText: makeGameText("WAVE 1", { size: 18, strokeWidth: 3 }),
    timerText: makeGameText("NEXT 8s", { size: 19, strokeWidth: 3 }),
    hpBackground: new Graphics(),
    hpFill: new Graphics(),
    hpText: makeGameText("100 / 100", { size: 16, strokeWidth: 3 }),
    firepowerChip: new Graphics(),
    unitsChip: new Graphics(),
    coinChip: new Graphics(),
    luckChip: new Graphics(),
    firepowerText: makeGameText("화력 0", { size: 14, strokeWidth: 2 }),
    unitsText: makeGameText("0 / 0", { size: 14, strokeWidth: 2 }),
    coinText: makeGameText("코인 0", { size: 14, fill: colors.yellow, strokeWidth: 3 }),
    luckText: makeGameText("행운석 0", { size: 14, fill: colors.blue, strokeWidth: 3 }),
  };

  view.waveText.anchor.set(0.5, 0);
  view.timerText.anchor.set(0.5, 0);
  view.hpText.anchor.set(0.5, 0);
  view.unitsText.anchor.set(0.5, 0);
  view.coinText.anchor.set(0.5, 0);
  view.luckText.anchor.set(0.5, 0);

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

  const chipY = hpY + 44;
  drawChip(view.firepowerChip, 24, chipY, 104, 30, 0x3d3027);
  view.firepowerText.text = `화력 ${snapshot.firepower}`;
  view.firepowerText.x = 38;
  view.firepowerText.y = chipY + 5;

  drawChip(view.unitsChip, layout.width - 128, chipY, 104, 30, 0x3d3027);
  view.unitsText.text = `${snapshot.unitCount} / ${snapshot.unitCapacity}`;
  view.unitsText.x = layout.width - 76;
  view.unitsText.y = chipY + 5;

  const resourceY = layout.height - 184;
  const resourceGap = 8;
  const resourceWidth = 96;
  const resourceTotalWidth = resourceWidth * 2 + resourceGap;
  const resourceX = layout.width / 2 - resourceTotalWidth / 2;

  drawChip(view.luckChip, resourceX, resourceY, resourceWidth, 28, 0x223d48);
  view.luckText.text = `행운석 ${snapshot.luckStones}`;
  view.luckText.x = resourceX + resourceWidth / 2;
  view.luckText.y = resourceY + 5;

  drawChip(view.coinChip, resourceX + resourceWidth + resourceGap, resourceY, resourceWidth, 28, 0x4f3d1e);
  view.coinText.text = `코인 ${snapshot.resources}`;
  view.coinText.x = resourceX + resourceWidth + resourceGap + resourceWidth / 2;
  view.coinText.y = resourceY + 5;
}
