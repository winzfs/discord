import { Container, Graphics, Text } from "pixi.js";
import type { GameLayout } from "./gameLayout";
import { colors } from "./gameTheme";

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
  summon: PixiButtonView;
  mythic: PixiButtonView;
  gamble: PixiButtonView;
  upgrade: PixiButtonView;
  wave: PixiButtonView;
  lastKey: string;
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

function redrawPanel(graphics: Graphics, width: number, height: number, fill: number, stroke = 0x51351e, radius = 14) {
  graphics.clear();
  graphics.roundRect(0, 0, width, height, radius);
  graphics.fill({ color: fill, alpha: 1 });
  graphics.stroke({ color: stroke, width: 3, alpha: 0.9 });
}

function createButton(width: number, height: number, color: number, onTap: () => void): PixiButtonView {
  const root = new Container();
  const background = new Graphics();
  const compact = height <= 56;
  const subText = makeText("", compact ? 10 : 12, colors.black);
  const mainText = makeText("", compact ? 17 : 22, colors.white);
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
  button.root.alpha = disabled ? 0.78 : 1;

  redrawPanel(button.background, button.width, button.height, disabled ? 0x6f6259 : button.color, disabled ? 0x3d332e : 0x51351e);

  button.subText.text = sub;
  button.subText.x = compact ? 12 : 16;
  button.subText.y = compact ? 5 : 9;
  button.subText.style.fill = disabled ? 0x2d2825 : colors.black;

  button.mainText.text = label;
  button.mainText.x = button.width / 2;
  button.mainText.y = compact ? 20 : 31;
  button.mainText.style.fill = disabled ? 0xd0c6bc : colors.white;
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
    summon: createButton(10, 78, colors.yellow, handlers.onSummon),
    mythic: createButton(92, 62, colors.orange, handlers.onMythic),
    gamble: createButton(92, 62, colors.blue, handlers.onGamble),
    upgrade: createButton(184, 50, 0x47584a, handlers.onUpgrade),
    wave: createButton(112, 48, colors.orange, handlers.onWave),
    lastKey: "",
  };
  view.root.addChild(view.summon.root, view.mythic.root, view.gamble.root, view.upgrade.root, view.wave.root);
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

  const summonWidth = layout.width * 0.52;
  view.summon.width = summonWidth;
  view.summon.height = 78;
  view.summon.root.x = (layout.width - summonWidth) / 2;
  view.summon.root.y = layout.height - 104;
  updateButton(view.summon, "소환", snapshot.summonLabel, snapshot.summonDisabled);

  view.mythic.root.x = 18;
  view.mythic.root.y = layout.height - 96;
  updateButton(view.mythic, "신화", snapshot.mythicReady ? "가능" : "조합", snapshot.mythicDisabled);

  view.gamble.root.x = layout.width - 110;
  view.gamble.root.y = layout.height - 96;
  updateButton(view.gamble, "도박", "행운석 2", snapshot.gambleDisabled);

  view.upgrade.root.x = (layout.width - 184) / 2;
  view.upgrade.root.y = layout.height - 166;
  updateButton(view.upgrade, "공격력 강화", `비용 ${snapshot.upgradeCost}`, snapshot.upgradeDisabled);

  const waveLabel = snapshot.wavePhase === "combat" ? `${snapshot.aliveEnemyCount}마리` : snapshot.wavePhase === "result" ? "바로 시작" : "시작";
  view.wave.color = snapshot.wavePhase === "combat" ? colors.red : colors.orange;
  view.wave.root.x = layout.width - 132;
  view.wave.root.y = layout.mapTop + 105;
  updateButton(view.wave, "웨이브", waveLabel, snapshot.waveDisabled);
}

export function invalidatePixiControlsView(view: PixiControlsView | null) {
  if (view) view.lastKey = "";
}
