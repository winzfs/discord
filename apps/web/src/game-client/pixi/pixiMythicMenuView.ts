import { Container, Graphics } from "pixi.js";
import {
  getHeroById,
  getMythicCraftAvailability,
  getMythicIngredientProgress,
  type GameState,
  type HeroGrade,
} from "@discord-random-defense/game";
import { colors } from "./gameTheme";
import { makePixiPanel, makePixiText } from "./pixiSharedView";
import { makePixiTouchBoundary, stopPixiPropagation } from "./pixiPointerGuards";

export type PixiMythicMenuViewOptions = {
  state: GameState;
  rendererWidth: number;
  rendererHeight: number;
  onClose: () => void;
  onCraft: (recipeId: string) => void;
};

type IngredientProgress = ReturnType<typeof getMythicIngredientProgress>[number];

const HEADER_HEIGHT = 58;
const ROW_HEIGHT = 144;
const ROW_GAP = 8;
const PANEL_MARGIN = 24;
const MENU_TOP_RATIO = 0.11;
const TAP_MOVE_CANCEL_DISTANCE = 8;

function createMythicMenuButton(label: string, x: number, y: number, onClick: () => void) {
  const button = new Container();
  button.x = x;
  button.y = y;
  button.eventMode = "static";
  button.cursor = "pointer";
  button.addChild(makePixiPanel(58, 28, 0x51443a, colors.orange, 9));

  const text = makePixiText(label, 12, colors.white);
  text.anchor.set(0.5);
  text.x = 29;
  text.y = 14;
  button.addChild(text);

  button.on("pointerdown", stopPixiPropagation);
  button.on("pointerup", stopPixiPropagation);
  button.on("pointertap", (event: any) => {
    event.stopPropagation();
    onClick();
  });

  return button;
}

function gradeColor(grade: HeroGrade | undefined) {
  if (grade === "mythic") return 0xffd447;
  if (grade === "legendary") return 0xff7a1f;
  if (grade === "epic") return 0x6f1dff;
  if (grade === "rare") return 0xa7efff;
  return 0xd8d0c8;
}

function gradeLabel(grade: HeroGrade | undefined) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

function getIngredientGrade(item: IngredientProgress): HeroGrade | undefined {
  if (item.heroId) return getHeroById(item.heroId)?.grade;
  if (item.label.includes("신화")) return "mythic";
  if (item.label.includes("전설")) return "legendary";
  if (item.label.includes("영웅")) return "epic";
  if (item.label.includes("희귀")) return "rare";
  if (item.label.includes("일반")) return "common";
  return undefined;
}

function summarizeIngredientProgress(progress: IngredientProgress[]) {
  const owned = progress.filter((item) => item.fulfilled).length;
  const total = progress.length;
  const missing = Math.max(0, total - owned);
  return { owned, total, missing };
}

function formatIngredientLabel(item: IngredientProgress) {
  const mark = item.fulfilled ? "✓" : "·";
  const grade = getIngredientGrade(item);
  return `${mark} [${gradeLabel(grade)}] ${item.label}`;
}

function drawIngredientSummary(row: Container, options: PixiMythicMenuViewOptions, recipe: ReturnType<typeof getMythicCraftAvailability>[number]["recipe"], y: number) {
  const progress = getMythicIngredientProgress(options.state, recipe);
  const summary = summarizeIngredientProgress(progress);

  const summaryText = makePixiText(
    `재료 ${summary.owned}/${summary.total}${summary.missing > 0 ? ` · 부족 ${summary.missing}` : " · 준비완료"}`,
    13,
    summary.missing === 0 ? 0xfff2a8 : 0xf0e8dd,
  );
  summaryText.x = 12;
  summaryText.y = y;
  row.addChild(summaryText);

  progress.forEach((item, index) => {
    const grade = getIngredientGrade(item);
    const line = makePixiText(formatIngredientLabel(item), 11, item.fulfilled ? 0xfff2a8 : 0xd8d0c8);
    line.x = 12;
    line.y = y + 22 + index * 17;
    line.alpha = item.fulfilled ? 1 : 0.9;
    row.addChild(line);

    const marker = new Graphics();
    marker.circle(0, 0, item.fulfilled ? 3.5 : 2.8);
    marker.fill({ color: gradeColor(grade), alpha: item.fulfilled ? 1 : 0.55 });
    marker.x = 318;
    marker.y = line.y + 8;
    row.addChild(marker);
  });
}

function createScrollViewport(width: number, height: number) {
  const viewport = new Container();
  const content = new Container();
  const mask = new Graphics();
  const hitArea = new Graphics();

  mask.rect(0, 0, width, height);
  mask.fill({ color: 0xffffff, alpha: 1 });

  hitArea.rect(0, 0, width, height);
  hitArea.fill({ color: 0x000000, alpha: 0.001 });

  content.mask = mask;
  viewport.addChild(hitArea, mask, content);
  return { viewport, content };
}

function bindVerticalDragScroll(viewport: Container, content: Container, viewportHeight: number, contentHeight: number) {
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  if (maxScroll <= 0) return;

  let dragging = false;
  let startY = 0;
  let startContentY = 0;

  viewport.eventMode = "static";
  viewport.cursor = "grab";
  viewport.on("pointerdown", (event: any) => {
    event.stopPropagation();
    dragging = true;
    startY = event.global.y;
    startContentY = content.y;
  });
  viewport.on("pointermove", (event: any) => {
    if (!dragging) return;
    event.stopPropagation();
    const nextY = startContentY + event.global.y - startY;
    content.y = Math.max(-maxScroll, Math.min(0, nextY));
  });
  viewport.on("pointerup", (event: any) => {
    event.stopPropagation();
    dragging = false;
  });
  viewport.on("pointerupoutside", () => {
    dragging = false;
  });
  viewport.on("wheel", (event: any) => {
    event.stopPropagation();
    content.y = Math.max(-maxScroll, Math.min(0, content.y - event.deltaY * 0.45));
  });
}

function bindCraftTap(row: Container, recipeId: string, onCraft: (recipeId: string) => void) {
  let downX = 0;
  let downY = 0;
  let moved = false;

  row.eventMode = "static";
  row.cursor = "pointer";
  row.on("pointerdown", (event: any) => {
    downX = event.global.x;
    downY = event.global.y;
    moved = false;
  });
  row.on("pointermove", (event: any) => {
    if (Math.abs(event.global.x - downX) > TAP_MOVE_CANCEL_DISTANCE || Math.abs(event.global.y - downY) > TAP_MOVE_CANCEL_DISTANCE) {
      moved = true;
    }
  });
  row.on("pointerup", (event: any) => {
    if (moved) return;
    event.stopPropagation();
    onCraft(recipeId);
  });
}

export function createPixiMythicMenuView(options: PixiMythicMenuViewOptions) {
  const list = getMythicCraftAvailability(options.state);
  const width = Math.min(360, options.rendererWidth - 24);
  const maxHeight = Math.max(320, options.rendererHeight - 190);
  const contentHeight = list.length * (ROW_HEIGHT + ROW_GAP);
  const viewportHeight = Math.min(maxHeight - HEADER_HEIGHT - PANEL_MARGIN, contentHeight);
  const height = HEADER_HEIGHT + viewportHeight + PANEL_MARGIN;
  const menu = new Container();
  menu.x = options.rendererWidth / 2 - width / 2;
  menu.y = Math.max(12, options.rendererHeight * MENU_TOP_RATIO);
  makePixiTouchBoundary(menu, width, height);
  menu.addChild(makePixiPanel(width, height, 0x2d2925, colors.orange, 16));

  const title = makePixiText("신화 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 14;
  menu.addChild(title);
  menu.addChild(createMythicMenuButton("닫기", width - 70, 12, options.onClose));

  const { viewport, content } = createScrollViewport(width - 24, viewportHeight);
  viewport.x = 12;
  viewport.y = HEADER_HEIGHT;
  menu.addChild(viewport);

  list.forEach((item, index) => {
    const y = index * (ROW_HEIGHT + ROW_GAP);
    const row = new Container();
    const rowWidth = width - 24;
    row.y = y;
    row.addChild(makePixiPanel(rowWidth, ROW_HEIGHT, item.canCraft ? 0x7a5528 : 0x655e59, item.canCraft ? 0xffb347 : 0x3d332e, 10));

    const recipeDefinition = getHeroById(item.recipe.id);
    const namePrefix = item.canCraft ? "조합 가능 · " : "";
    const name = makePixiText(`${namePrefix}${item.recipe.displayName}`, 16, gradeColor(recipeDefinition?.grade));
    name.x = 12;
    name.y = 8;
    row.addChild(name);

    if (item.canCraft) {
      const craftHint = makePixiText("터치", 11, 0xfff2a8);
      craftHint.anchor.set(1, 0);
      craftHint.x = rowWidth - 12;
      craftHint.y = 10;
      row.addChild(craftHint);
      bindCraftTap(row, item.recipe.id, options.onCraft);
    }

    drawIngredientSummary(row, options, item.recipe, 37);
    content.addChild(row);
  });

  bindVerticalDragScroll(viewport, content, viewportHeight, contentHeight);

  if (contentHeight > viewportHeight) {
    const hintBackground = new Graphics();
    hintBackground.rect(12, height - 26, width - 24, 20);
    hintBackground.fill({ color: 0x1f1b18, alpha: 0.82 });
    menu.addChild(hintBackground);

    const hint = makePixiText("목록을 위아래로 드래그", 10, 0xd8d0c8);
    hint.anchor.set(0.5, 1);
    hint.x = width / 2;
    hint.y = height - 9;
    menu.addChild(hint);
  }

  return menu;
}
