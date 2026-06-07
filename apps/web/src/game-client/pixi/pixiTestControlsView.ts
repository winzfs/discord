import { Container, Graphics, Text } from "pixi.js";
import { getHeroById } from "@discord-random-defense/game";
import type { GameLayout } from "./gameLayout";
import type { GameRefs, PixiTestControlsView } from "./pixiGameTypes";
import { colors } from "./gameTheme";
import {
  adjustPixiTestHeroScale,
  getPixiTestHeroScale,
  pixiTestEnemyHpMultipliers,
  pixiTestHeroIds,
  resetPixiTestHeroScale,
  setPixiTestEnemyHpMultiplier,
  summonPixiTestHero,
} from "./pixiTestControlsRuntime";

export type PixiTestControlsOptions = {
  onChange: () => void;
};

const HERO_COLUMNS = 3;
const HERO_VISIBLE_ROWS = 4;

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
  const text = makeText(label, label.length > 7 ? 9 : 10);

  background.roundRect(0, 0, width, height, 8);
  background.fill({ color, alpha: 0.94 });
  background.stroke({ color: colors.black, width: 2, alpha: 0.35 });
  text.anchor.set(0.5);
  text.x = width / 2;
  text.y = height / 2;
  root.addChild(background, text);
  root.eventMode = "static";
  root.cursor = "pointer";
  root.on("pointertap", onTap);
  return root;
}

function drawPanel(width: number, height: number) {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, 12);
  panel.fill({ color: 0x1d2430, alpha: 0.82 });
  panel.stroke({ color: 0xffffff, width: 1, alpha: 0.16 });
  return panel;
}

function heroButtonColor(heroId: string) {
  const grade = getHeroById(heroId)?.grade;
  if (grade === "mythic") return 0xff4fcf;
  if (grade === "legendary") return colors.yellow;
  if (grade === "epic") return 0x9f70ff;
  if (grade === "rare") return colors.blue;
  return colors.orange;
}

function saveStatusColor(view: PixiTestControlsView) {
  if (view.scaleSaveStatus === "saved") return colors.green;
  if (view.scaleSaveStatus === "error") return colors.orange;
  if (view.scaleSaveStatus === "saving") return colors.yellow;
  return colors.white;
}

function clampScrollRow(row: number) {
  const totalRows = Math.ceil(pixiTestHeroIds.length / HERO_COLUMNS);
  return Math.max(0, Math.min(Math.max(0, totalRows - HERO_VISIBLE_ROWS), row));
}

function invalidateAndChange(view: PixiTestControlsView, options: PixiTestControlsOptions) {
  view.lastKey = "";
  options.onChange();
}

function setScaleSaveStatus(
  view: PixiTestControlsView,
  options: PixiTestControlsOptions,
  status: PixiTestControlsView["scaleSaveStatus"],
  message: string,
) {
  view.scaleSaveStatus = status;
  view.scaleSaveMessage = message;
  invalidateAndChange(view, options);
}

function trackScaleSave(view: PixiTestControlsView, options: PixiTestControlsOptions, result: ReturnType<typeof adjustPixiTestHeroScale>) {
  if (!result) return;
  setScaleSaveStatus(view, options, "saving", "서버 저장중...");
  void result.savePromise
    .then(() => setScaleSaveStatus(view, options, "saved", "서버 저장 완료"))
    .catch((error) => setScaleSaveStatus(view, options, "error", error instanceof Error ? `서버 저장 실패: ${error.message}` : "서버 저장 실패"));
}

export function createPixiTestControlsView(parent: Container): PixiTestControlsView {
  const view = {
    root: new Container(),
    lastKey: "",
    collapsed: false,
    scrollRow: 0,
    scaleHeroId: null,
    scaleSaveStatus: "idle" as const,
    scaleSaveMessage: "",
  };
  parent.addChild(view.root);
  return view;
}

export function updatePixiTestControlsView(
  view: PixiTestControlsView,
  refs: GameRefs,
  layout: GameLayout,
  options: PixiTestControlsOptions,
  force = false,
) {
  view.scrollRow = clampScrollRow(view.scrollRow);
  const selectedScale = getPixiTestHeroScale(view.scaleHeroId);
  const selectedScaleKey = selectedScale ? `${selectedScale.heroId}:${selectedScale.scale}` : "none";
  const key = `${layout.width}|${layout.height}|${refs.testEnemyHpMultiplier}|${view.collapsed}|${view.scrollRow}|${selectedScaleKey}|${view.scaleSaveStatus}|${view.scaleSaveMessage}`;
  if (!force && view.lastKey === key) return;
  view.lastKey = key;
  view.root.removeChildren();

  const panelWidth = Math.min(layout.width - 24, 370);
  const buttonHeight = 28;
  const gap = 7;
  const panelHeight = view.collapsed ? 42 : 314;
  const buttonWidth = Math.floor((panelWidth - 24 - gap * (HERO_COLUMNS - 1)) / HERO_COLUMNS);
  const hpButtonWidth = 36;
  const hpButtonGap = 4;

  view.root.x = 12;
  view.root.y = Math.min(layout.boardY + layout.boardHeight + 10, layout.bottomY - panelHeight - 8);
  view.root.addChild(drawPanel(panelWidth, panelHeight));

  const title = makeText(view.collapsed ? "테스트 소환 펼치기" : "테스트 소환 · 모든 유닛", 13, colors.yellow);
  title.x = 12;
  title.y = 9;
  view.root.addChild(title);

  const toggle = makeButton(view.collapsed ? "펼치기" : "접기", 60, 26, colors.blue, () => {
    view.collapsed = !view.collapsed;
    invalidateAndChange(view, options);
  });
  toggle.x = panelWidth - 72;
  toggle.y = 8;
  view.root.addChild(toggle);

  if (view.collapsed) return;

  const startIndex = view.scrollRow * HERO_COLUMNS;
  const visibleHeroIds = pixiTestHeroIds.slice(startIndex, startIndex + HERO_COLUMNS * HERO_VISIBLE_ROWS);

  visibleHeroIds.forEach((heroId, index) => {
    const hero = getHeroById(heroId);
    const isScaleTarget = view.scaleHeroId === heroId;
    const button = makeButton(hero?.displayName ?? heroId, buttonWidth, buttonHeight, isScaleTarget ? colors.green : heroButtonColor(heroId), () => {
      summonPixiTestHero(refs, heroId);
      view.scaleHeroId = heroId;
      view.scaleSaveStatus = "idle";
      view.scaleSaveMessage = "";
      refs.selectedCellIndex = null;
      invalidateAndChange(view, options);
    });
    button.x = 12 + (index % HERO_COLUMNS) * (buttonWidth + gap);
    button.y = 40 + Math.floor(index / HERO_COLUMNS) * (buttonHeight + gap);
    view.root.addChild(button);
  });

  const totalRows = Math.ceil(pixiTestHeroIds.length / HERO_COLUMNS);
  const pageLabel = makeText(`${view.scrollRow + 1}-${Math.min(totalRows, view.scrollRow + HERO_VISIBLE_ROWS)} / ${totalRows}`, 10, colors.white);
  pageLabel.anchor.set(0.5);
  pageLabel.x = panelWidth / 2;
  pageLabel.y = 184;
  view.root.addChild(pageLabel);

  const upButton = makeButton("▲", 42, 26, view.scrollRow <= 0 ? 0x4b5565 : colors.blue, () => {
    view.scrollRow = clampScrollRow(view.scrollRow - 1);
    invalidateAndChange(view, options);
  });
  upButton.x = panelWidth - 96;
  upButton.y = 172;
  view.root.addChild(upButton);

  const downButton = makeButton("▼", 42, 26, view.scrollRow >= totalRows - HERO_VISIBLE_ROWS ? 0x4b5565 : colors.blue, () => {
    view.scrollRow = clampScrollRow(view.scrollRow + 1);
    invalidateAndChange(view, options);
  });
  downButton.x = panelWidth - 50;
  downButton.y = 172;
  view.root.addChild(downButton);

  const scaleLabelText = selectedScale
    ? `스케일 ${selectedScale.displayName} ${selectedScale.scale.toFixed(2)}`
    : "스케일: 유닛 버튼을 누르세요";
  const scaleLabel = makeText(scaleLabelText, 11, selectedScale ? colors.yellow : colors.white);
  scaleLabel.x = 12;
  scaleLabel.y = 210;
  view.root.addChild(scaleLabel);

  const scaleDownButton = makeButton("-0.03", 50, 24, selectedScale ? colors.blue : 0x4b5565, () => {
    trackScaleSave(view, options, adjustPixiTestHeroScale(view.scaleHeroId, -0.03));
  });
  scaleDownButton.x = 12;
  scaleDownButton.y = 230;
  view.root.addChild(scaleDownButton);

  const scaleUpButton = makeButton("+0.03", 50, 24, selectedScale ? colors.blue : 0x4b5565, () => {
    trackScaleSave(view, options, adjustPixiTestHeroScale(view.scaleHeroId, 0.03));
  });
  scaleUpButton.x = 68;
  scaleUpButton.y = 230;
  view.root.addChild(scaleUpButton);

  const scaleResetButton = makeButton("초기화", 62, 24, selectedScale ? colors.orange : 0x4b5565, () => {
    trackScaleSave(view, options, resetPixiTestHeroScale(view.scaleHeroId));
  });
  scaleResetButton.x = 124;
  scaleResetButton.y = 230;
  view.root.addChild(scaleResetButton);

  const saveText = makeText(view.scaleSaveMessage || " ", 10, saveStatusColor(view));
  saveText.x = 12;
  saveText.y = 258;
  view.root.addChild(saveText);

  const hpLabel = makeText(`몬스터 HP x${refs.testEnemyHpMultiplier}`, 12, colors.white);
  hpLabel.x = 12;
  hpLabel.y = 282;
  view.root.addChild(hpLabel);

  pixiTestEnemyHpMultipliers.forEach((multiplier, index) => {
    const selected = refs.testEnemyHpMultiplier === multiplier;
    const button = makeButton(`x${multiplier}`, hpButtonWidth, 26, selected ? colors.green : colors.blue, () => {
      setPixiTestEnemyHpMultiplier(refs, multiplier);
      invalidateAndChange(view, options);
    });
    button.x = 104 + index * (hpButtonWidth + hpButtonGap);
    button.y = 278;
    view.root.addChild(button);
  });
}
