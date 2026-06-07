import { Container, Graphics, Text } from "pixi.js";
import type { SkillEffectType, WaveTacticalTheme } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { drawGamePanel, drawSegmentedBar } from "./pixiGameUiPrimitives";
import { makeGameText } from "./pixiTextStyles";

export type HudWavePhase = "countdown" | "combat" | "result";

export type HudSnapshot = {
  currentWave: number;
  waveTitle: string;
  waveTheme: WaveTacticalTheme;
  recommendedEffects: SkillEffectType[];
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
  waveInfoBox: Graphics;
  waveInfoText: Text;
  waveRecommendText: Text;
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

function getWaveThemeLabel(theme: WaveTacticalTheme) {
  if (theme === "rush") return "러시";
  if (theme === "armored") return "중장";
  if (theme === "elite") return "엘리트";
  if (theme === "boss") return "보스";
  if (theme === "mixed") return "혼합";
  return "군집";
}

function getEffectLabel(effect: SkillEffectType) {
  if (effect === "splash") return "광역";
  if (effect === "chain") return "연쇄";
  if (effect === "control") return "제어";
  if (effect === "amplify") return "증폭";
  if (effect === "tempo") return "템포";
  if (effect === "economy") return "경제";
  if (effect === "execute") return "처형";
  if (effect === "shield") return "방어";
  if (effect === "summon") return "소환";
  return "피해";
}

export function createPixiHudView(parent: Container): PixiHudView {
  const view: PixiHudView = {
    root: new Container(),
    waveBox: new Graphics(),
    waveText: makeGameText("WAVE 1", { size: 18, strokeWidth: 3 }),
    timerText: makeGameText("NEXT 8s", { size: 19, strokeWidth: 3 }),
    hpBackground: new Graphics(),
    hpFill: new Graphics(),
    hpText: makeGameText("ENEMY 0 / 100", { size: 16, strokeWidth: 3 }),
    waveInfoBox: new Graphics(),
    waveInfoText: makeGameText("군집 웨이브", { size: 12, strokeWidth: 2 }),
    waveRecommendText: makeGameText("추천: 광역 · 연쇄", { size: 12, fill: 0xffe7a3, strokeWidth: 2 }),
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
  view.waveInfoText.anchor.set(0, 0);
  view.waveRecommendText.anchor.set(1, 0);
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
    view.waveInfoBox,
    view.waveInfoText,
    view.waveRecommendText,
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
  view.waveInfoBox.clear();
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

  view.hpText.text = `ENEMY ${snapshot.lives} / ${snapshot.maxLives}`;
  view.hpText.x = layout.width / 2;
  view.hpText.y = hpY + 4;

  const waveInfoY = hpY + 38;
  const waveInfoX = 24;
  const waveInfoWidth = layout.width - 48;
  const waveInfoHeight = 26;
  view.waveInfoBox.clear();
  view.waveInfoBox.roundRect(waveInfoX + 2, waveInfoY + 3, waveInfoWidth, waveInfoHeight, 12);
  view.waveInfoBox.fill({ color: 0x000000, alpha: 0.18 });
  view.waveInfoBox.roundRect(waveInfoX, waveInfoY, waveInfoWidth, waveInfoHeight, 12);
  view.waveInfoBox.fill({ color: boss ? 0x4b2630 : 0x3d3027, alpha: 0.9 });
  view.waveInfoBox.stroke({ color: boss ? 0xc64949 : 0x2d1b18, width: 2, alpha: 0.72 });

  view.waveInfoText.text = `${getWaveThemeLabel(snapshot.waveTheme)} · ${snapshot.waveTitle}`;
  view.waveInfoText.x = waveInfoX + 10;
  view.waveInfoText.y = waveInfoY + 6;
  view.waveInfoText.style.fill = boss ? 0xffd7d7 : colors.white;

  view.waveRecommendText.text = `추천 ${snapshot.recommendedEffects.slice(0, 3).map(getEffectLabel).join(" · ")}`;
  view.waveRecommendText.x = waveInfoX + waveInfoWidth - 10;
  view.waveRecommendText.y = waveInfoY + 6;
  view.waveRecommendText.style.fill = boss ? 0xffc266 : 0xffe7a3;

  const chipY = waveInfoY + 38;
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