import { Container, Graphics } from "pixi.js";
import {
  getHeroById,
  getMythicCraftAvailability,
  getMythicIngredientProgress,
  type GameState,
  type HeroGrade,
} from "@discord-random-defense/game";
import { colors, gradeColor as themeGradeColor } from "./gameTheme";
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
type MythicCraftItem = ReturnType<typeof getMythicCraftAvailability>[number];

const HEADER_HEIGHT = 58;
const ROW_HEIGHT = 104;
const ROW_GAP = 8;
const ROW_STEP = ROW_HEIGHT + ROW_GAP;
const PANEL_MARGIN = 24;
const MENU_TOP_RATIO = 0.11;
const TAP_MOVE_CANCEL_DISTANCE = 8;
const INGREDIENT_FONT_SIZE = 11;
const GRADE_LABEL_WIDTH = 38;
const VISIBLE_ROW_BUFFER = 2;

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
  return themeGradeColor(grade);
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

function drawGradeLabel(row: Container, grade: HeroGrade | undefined, x: number, y: number, fulfilled: boolean) {
  const label = gradeLabel(grade);
  const background = new Graphics();
  background.roundRect(x, y + 1, GRADE_LABEL_WIDTH, 15, 5);
  background.fill({ color: gradeColor(grade), alpha: fulfilled ? 1 : 0.86 });
  background.stroke({ color: 0x211812, width: 1.4, alpha: 0.82 });
  row.addChild(background);

  const shadow = makePixiText(label, 9, 0x17110f);
  shadow.anchor.set(0.5, 0);
  shadow.x = x + GRADE_LABEL_WIDTH / 2 + 1;
  shadow.y = y + 3;
  shadow.alpha = 0.68;
  row.addChild(shadow);

  const text = makePixiText(label, 9, colors.white);
  text.anchor.set(0.5, 0);
  text.x = x + GRADE_LABEL_WIDTH / 2;
  text.y = y + 2;
  text.alpha = fulfilled ? 1 : 0.96;
  row.addChild(text);
}

function drawIngredientItem(row: Container, item: IngredientProgress, x: number, y: number) {
  const grade = getIngredientGrade(item);
  const mark = makePixiText(item.fulfilled ? "✓" : "·", INGREDIENT_FONT_SIZE, item.fulfilled ? 0xfff2a8 : 0xd8d0c8);
  mark.x = x;
  mark.y = y;
  row.addChild(mark);

  drawGradeLabel(row, grade, x + 10, y, item.fulfilled);

  const name = makePixiText(item.label, INGREDIENT_FONT_SIZE, item.fulfilled ? 0xfff2a8 : 0xf0e8dd);
  name.x = x + 10 + GRADE_LABEL_WIDTH + 4;
  name.y = y;
  name.alpha = item.fulfilled ? 1 : 0.92;
  row.addChild(name);
}

function drawIngredientSummary(
  row: Container,
  options: PixiMythicMenuViewOptions,
  recipe: MythicCraftItem["recipe"],
  y: number,
  rowWidth: number,
) {
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

  const columnWidth = Math.floor((rowWidth - 30) / 2);
  progress.slice(0, 4).forEach((item, index) => {
    drawIngredientItem(
      row,
      item,
      12 + (index % 2) * columnWidth,
      y + 24 + Math.floor(index / 2) * 22,
    );
  });
}

function createScrollViewport(width: number, height: number) {
  const viewport = new Container();
  const content = new Container();
  const spacer = new Graphics();
  const mask = new Graphics();
  const hitArea = new Graphics();

  mask.rect(0, 0, width, height);
  mask.fill({ color: 0xffffff, alpha: 1 });

  hitArea.rect(0, 0, width, height);
  hitArea.fill({ color: 0x000000, alpha: 0.001 });

  content.mask = mask;
  viewport.addChild(hitArea, mask, spacer, content);
  return { viewport, content, spacer };
}

function clampScroll(content: Container, maxScroll: number, nextY: number) {
  content.y = Math.max(-maxScroll, Math.min(0, nextY));
}

function clearRows(content: Container) {
  content.removeChildren().forEach((child) => child.destroy({ children: true }));
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

function createRecipeRow(
  item: MythicCraftItem,
  index: number,
  rowWidth: number,
  options: PixiMythicMenuViewOptions,
) {
  const row = new Container();
  row.y = index * ROW_STEP;
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

  drawIngredientSummary(row, options, item.recipe, 37, rowWidth);
  return row;
}

function createVirtualRowRenderer(
  list: MythicCraftItem[],
  content: Container,
  rowWidth: number,
  viewportHeight: number,
  options: PixiMythicMenuViewOptions,
) {
  let renderedStart = -1;
  let renderedEnd = -1;

  return () => {
    const scrollTop = Math.max(0, -content.y);
    const start = Math.max(0, Math.floor(scrollTop / ROW_STEP) - VISIBLE_ROW_BUFFER);
    const end = Math.min(
      list.length - 1,
      Math.ceil((scrollTop + viewportHeight) / ROW_STEP) + VISIBLE_ROW_BUFFER,
    );

    if (start === renderedStart && end === renderedEnd) return;
    renderedStart = start;
    renderedEnd = end;

    clearRows(content);
    for (let index = start; index <= end; index += 1) {
      content.addChild(createRecipeRow(list[index], index, rowWidth, options));
    }
  };
}

function bindVerticalDragScroll(
  viewport: Container,
  content: Container,
  viewportHeight: number,
  contentHeight: number,
  renderVisibleRows: () => void,
) {
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
    clampScroll(content, maxScroll, startContentY + event.global.y - startY);
    renderVisibleRows();
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
    clampScroll(content, maxScroll, content.y - event.deltaY * 0.45);
    renderVisibleRows();
  });
}

export function createPixiMythicMenuView(options: PixiMythicMenuViewOptions) {
  const list = getMythicCraftAvailability(options.state);
  const width = Math.min(360, options.rendererWidth - 24);
  const maxHeight = Math.max(320, options.rendererHeight - 190);
  const contentHeight = list.length * ROW_STEP;
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

  const rowWidth = width - 24;
  const { viewport, content, spacer } = createScrollViewport(rowWidth, viewportHeight);
  viewport.x = 12;
  viewport.y = HEADER_HEIGHT;
  spacer.rect(0, 0, rowWidth, contentHeight);
  spacer.fill({ color: 0x000000, alpha: 0.001 });
  menu.addChild(viewport);

  const renderVisibleRows = createVirtualRowRenderer(list, content, rowWidth, viewportHeight, options);
  renderVisibleRows();
  bindVerticalDragScroll(viewport, content, viewportHeight, contentHeight, renderVisibleRows);

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
