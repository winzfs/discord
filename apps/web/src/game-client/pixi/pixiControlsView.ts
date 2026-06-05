import { Container, Graphics, Text } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";
import { paintControlButton, paintControlDock } from "./pixiControlButtonPaint";
import { makeGameText } from "./pixiTextStyles";

export type ControlsWavePhase = "countdown" | "combat" | "result";

export type ControlsSnapshot = {
  summonLabel: string;
  summonDisabled: boolean;
  mythicReady: boolean;
  mythicDisabled: boolean;
  gambleDisabled: boolean;
  upgradeCost: number;
  upgradeLevel: number;
  upgradeDisabled: boolean;
  wavePhase: ControlsWavePhase;
  aliveEnemyCount: number;
  waveDisabled: boolean;
};

export type PixiButtonView = {
  root: Container;
  background: Graphics;
  subText: Text;
  mainText: Text;
  width: number;
  height: number;
  color: number;
  disabled: boolean;
  onTap: () => void;
};

export type PixiControlsView = {
  root: Container;
  dock: Graphics;
  waveBacking: Graphics;
  summon: PixiButtonView;
  mythic: PixiButtonView;
  gamble: PixiButtonView;
  upgrade: PixiButtonView;
  wave: PixiButtonView;
  lastKey: string;
};

function redrawPanel(graphics: Graphics, width: number, height: number, fill: number, disabled: boolean, radius = 14) {
  paintControlButton(graphics, width, height, fill, disabled, radius);
}

function drawWaveBacking(graphics: Graphics, x: number, y: number, width: number, height: number) {
  graphics.clear();
  graphics.roundRect(x + 4, y + 6, width, height, 18);
  graphics.fill({ color: 0x000000, alpha: 0.18 });
  graphics.roundRect(x, y, width, height, 18);
  graphics.fill({ color: 0x2d211d, alpha: 0.6 });
  graphics.stroke({ color: 0x1a1110, width: 4, alpha: 0.78 });
}

function createButton(width: number, height: number, color: number, onTap: () => void): PixiButtonView {
  const root = new Container();
  const background = new Graphics();
  const compact = height <= 56;
  const subText = makeGameText("", { size: compact ? 10 : 12, fill: colors.black, strokeWidth: 1, shadow: false });
  const mainText = makeGameText("", { size: compact ? 17 : 22, fill: colors.white, strokeWidth: compact ? 3 : 4 });
  mainText.anchor.set(0.5, 0);

  root.addChild(background, subText, mainText);
  root.eventMode = "static";
  root.cursor = "pointer";
  root.on("pointertap", () => {
    if (root.eventMode === "none") return;
    root.scale.set(0.96);
    window.setTimeout(() => root.scale.set(1), 80);
    onTap();
  });

  return { root, background, subText, mainText, width, height, color, disabled: false, onTap };
}

function updateButton(button: PixiButtonView, label: string, sub: string, disabled: boolean) {
  const compact = button.height <= 56;
  button.disabled = disabled;
  button.root.eventMode = disabled ? "none" : "static";
  button.root.cursor = disabled ? "default" : "pointer";
  button.root.alpha = disabled ? 0.9 : 1;

  redrawPanel(button.background, button.width, button.height, disabled ? 0x5f574f : button.color, disabled, compact ? 16 : 20);

  button.subText.text = sub;
  button.subText.x = compact ? 12 : 16;
  button.subText.y = compact ? 5 : 9;
  button.subText.style.fill = disabled ? 0x201b18 : colors.black;
  button.subText.style.fontSize = compact ? 10 : 12;

  button.mainText.text = label;
  button.mainText.x = button.width / 2;
  button.mainText.y = compact ? 21 : 32;
  button.mainText.style.fill = disabled ? 0xf2e5d7 : colors.white;
  button.mainText.style.fontSize = compact ? 17 : 23;
}

export function createPixiControlsView(parent: Container, handlers: {
  onSummon: () => void;
  onMythic: () => void;
  onGamble: () => void;
  onUpgrade: () => void;
  onWave: () => void;
}): PixiControlsView {
  const view: PixiControlsView = {
    root: new Container(),
    dock: new Graphics(),
    waveBacking: new Graphics(),
    summon: createButton(10, 78, colors.yellow, handlers.onSummon),
    mythic: createButton(92, 62, colors.orange, handlers.onMythic),
    gamble: createButton(92, 62, colors.blue, handlers.onGamble),
    upgrade: createButton(184, 50, 0x47584a, handlers.onUpgrade),
    wave: createButton(112, 48, colors.orange, handlers.onWave),
    lastKey: "",
  };
  view.root.addChild(view.dock, view.waveBacking, view.summon.root, view.mythic.root, view.gamble.root, view.upgrade.root, view.wave.root);
  parent.addChild(view.root);
  return view;
}

export function createControlsSnapshotKey(snapshot: ControlsSnapshot) {
  return [
    snapshot.summonLabel,
    snapshot.summonDisabled,
    snapshot.mythicReady,
    snapshot.mythicDisabled,
    snapshot.gambleDisabled,
    snapshot.upgradeCost,
    snapshot.upgradeLevel,
    snapshot.upgradeDisabled,
    snapshot.wavePhase,
    snapshot.aliveEnemyCount,
    snapshot.waveDisabled,
  ].join("|");
}

export function updatePixiControlsView(view: PixiControlsView, layout: GameLayout, snapshot: ControlsSnapshot, force = false) {
  const key = createControlsSnapshotKey(snapshot);
  if (!force && view.lastKey === key) return;
  view.lastKey = key;

  paintControlDock(view.dock, 18, layout.height - 108, layout.width - 36, 94);

  const summonWidth = Math.min(layout.width * 0.44, layout.width - 240);
  view.summon.width = summonWidth;
  view.summon.height = 74;
  view.summon.root.x = (layout.width - summonWidth) / 2;
  view.summon.root.y = layout.height - 92;
  updateButton(view.summon, "소환", snapshot.summonDisabled ? `부족 ${snapshot.summonLabel.replace(/[^0-9]/g, "") || ""}`.trim() : snapshot.summonLabel, snapshot.summonDisabled);

  view.mythic.width = 92;
  view.mythic.height = 60;
  view.mythic.root.x = 28;
  view.mythic.root.y = layout.height - 86;
  updateButton(view.mythic, "신화", snapshot.mythicReady ? "가능" : "조합", snapshot.mythicDisabled);

  view.gamble.width = 92;
  view.gamble.height = 60;
  view.gamble.root.x = layout.width - 120;
  view.gamble.root.y = layout.height - 86;
  updateButton(view.gamble, "도박", "행운석 2", snapshot.gambleDisabled);

  view.upgrade.width = 190;
  view.upgrade.height = 46;
  view.upgrade.color = snapshot.upgradeDisabled ? 0x5f574f : 0x2f8f55;
  view.upgrade.root.x = (layout.width - view.upgrade.width) / 2;
  view.upgrade.root.y = layout.height - 152;
  updateButton(view.upgrade, snapshot.upgradeDisabled ? "강화 불가" : "공격력 강화", `비용 ${snapshot.upgradeCost}`, snapshot.upgradeDisabled);

  const waveLabel = snapshot.wavePhase === "combat" ? `${snapshot.aliveEnemyCount}마리` : snapshot.wavePhase === "result" ? "시작 가능" : "대기";
  view.wave.color = snapshot.wavePhase === "combat" ? 0xd94a4a : snapshot.wavePhase === "result" ? 0xffc42a : colors.orange;
  view.wave.width = 112;
  view.wave.height = 50;
  view.wave.root.x = layout.width - 132;
  view.wave.root.y = layout.mapTop + 132;
  drawWaveBacking(view.waveBacking, view.wave.root.x - 7, view.wave.root.y - 7, view.wave.width + 14, view.wave.height + 14);
  updateButton(view.wave, "웨이브", waveLabel, snapshot.waveDisabled);
}

export function invalidatePixiControlsView(view: PixiControlsView | null) {
  if (view) view.lastKey = "";
}
