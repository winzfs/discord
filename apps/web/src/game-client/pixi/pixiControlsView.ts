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
  graphics.roundRect(x + 4, y + 7, width, height, 18);
  graphics.fill({ color: 0x000000, alpha: 0.24 });
  graphics.roundRect(x, y, width, height, 18);
  graphics.fill({ color: 0x2d211d, alpha: 0.74 });
  graphics.stroke({ color: 0x1a1110, width: 4, alpha: 0.86 });
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
  button.root.alpha = disabled ? 0.82 : 1;

  redrawPanel(button.background, button.width, button.height, disabled ? 0x6f6259 : button.color, disabled, compact ? 16 : 20);

  button.subText.text = sub;
  button.subText.x = compact ? 12 : 16;
  button.subText.y = compact ? 5 : 9;
  button.subText.style.fill = disabled ? 0x2d2825 : colors.black;
  button.subText.style.fontSize = compact ? 10 : 12;

  button.mainText.text = label;
  button.mainText.x = button.width / 2;
  button.mainText.y = compact ? 21 : 32;
  button.mainText.style.fill = disabled ? 0xd0c6bc : colors.white;
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

  paintControlDock(view.dock, 14, layout.height - 116, layout.width - 28, 106);

  const summonWidth = Math.min(layout.width * 0.48, layout.width - 230);
  view.summon.width = summonWidth;
  view.summon.height = 80;
  view.summon.root.x = (layout.width - summonWidth) / 2;
  view.summon.root.y = layout.height - 100;
  updateButton(view.summon, "소환", snapshot.summonLabel, snapshot.summonDisabled);

  view.mythic.width = 96;
  view.mythic.height = 64;
  view.mythic.root.x = 20;
  view.mythic.root.y = layout.height - 92;
  updateButton(view.mythic, "신화", snapshot.mythicReady ? "가능" : "조합", snapshot.mythicDisabled);

  view.gamble.width = 96;
  view.gamble.height = 64;
  view.gamble.root.x = layout.width - 116;
  view.gamble.root.y = layout.height - 92;
  updateButton(view.gamble, "도박", "행운석 2", snapshot.gambleDisabled);

  view.upgrade.width = 214;
  view.upgrade.height = 54;
  view.upgrade.color = snapshot.upgradeDisabled ? 0x5f574f : 0x2f8f55;
  view.upgrade.root.x = (layout.width - view.upgrade.width) / 2;
  view.upgrade.root.y = layout.height - 174;
  updateButton(view.upgrade, snapshot.upgradeDisabled ? "강화 불가" : "공격력 강화", `비용 ${snapshot.upgradeCost}`, snapshot.upgradeDisabled);

  const waveLabel = snapshot.wavePhase === "combat" ? `${snapshot.aliveEnemyCount}마리` : snapshot.wavePhase === "result" ? "즉시 시작" : "대기";
  view.wave.color = snapshot.wavePhase === "combat" ? 0xd94a4a : snapshot.wavePhase === "result" ? 0xffc42a : colors.orange;
  view.wave.width = 126;
  view.wave.height = 58;
  view.wave.root.x = layout.width - 148;
  view.wave.root.y = layout.mapTop + 96;
  drawWaveBacking(view.waveBacking, view.wave.root.x - 8, view.wave.root.y - 8, view.wave.width + 16, view.wave.height + 16);
  updateButton(view.wave, "웨이브", waveLabel, snapshot.waveDisabled);
}

export function invalidatePixiControlsView(view: PixiControlsView | null) {
  if (view) view.lastKey = "";
}
