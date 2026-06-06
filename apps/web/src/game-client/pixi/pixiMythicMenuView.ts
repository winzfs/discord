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
const ROW_HEIGHT = 74;
const ROW_GAP = 8;
const PANEL_MARGIN = 24;
const MENU_TOP_RATIO = 0.11;

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

function getIngredientGrade(item: IngredientProgress): HeroGrade | undefined {
  if (item.heroId) return getHeroById(item.heroId)?.grade;
  if (item.label.includes("신화")) return "mythic";
  if (item.label.includes("전설")) return "legendary";
  if (item.label.includes("영웅")) return "epic";
  if (item.label.includes("희귀")) return "rare";
  if (item.label.includes("일반")) return "common";
  return undefined;
}

function getIngredientTextColor(item: IngredientProgress) {
  if (item.fulfilled) return 0xfff2a8;
  if (item.owned > 0) return 0xffe16b;
  return 0xb7afa8;
}

function makeIngredientChip(item: IngredientProgress, maxWidth: number) {
  const chip = new Container();
  const grade = getIngredientGrade(item);
  const border = gradeColor(grade);
  const fill = item.fulfilled ? 0x4d452f : item.owned > 0 ? 0x514739 : 0x3c3834;
  const mark = item.fulfilled ? "✓" : item.owned > 0 ? "보유" : "부족";
  const value = `${mark} ${item.label} ${Math.min(item.owned, item.required)}/${item.required}`;
  const text = makePixiText(value, 9, getIngredientTextColor(item));
  text.x = 7;
  text.y = 5;

  const chipWidth = Math.min(maxWidth, Math.max(58, text.width + 14));
  if (text.width > chipWidth - 14) {
    const maxChars = Math.max(8, Math.floor((chipWidth - 14) / 7));
    text.text = `${value.slice(0, maxChars - 1)}…`;
  }

  chip.addChild(makePixiPanel(chipWidth, 22, fill, border, 8));
  chip.addChild(text);
  return { chip, width: chipWidth };
}

function drawIngredientProgress(row: Container, options: PixiMythicMenuViewOptions, recipe: ReturnType<typeof getMythicCraftAvailability>[number]["recipe"], y: number, rowWidth: number) {
  const progress = getMythicIngredientProgress(options.state, recipe);
  const maxChipWidth = Math.floor((rowWidth - 30) / 2);
  let x = 10;
  let line = 0;

  progress.slice(0, 4).forEach((item) => {
    const { chip, width } = makeIngredientChip(item, maxChipWidth);
    if (x + width > rowWidth - 10 && x > 10) {
      x = 10;
      line += 1;
    }

    chip.x = x;
    chip.y = y + line * 24;
    row.addChild(chip);
    x += width + 8;
  });
}

function createScrollViewport(width: number, height: number) {
  const viewport = new Container();
  const content = new Container();
  const mask = new Graphics();
  mask.rect(0, 0, width, height);
  mask.fill({ color: 0xffffff, alpha: 1 });
  content.mask = mask;
  viewport.addChild(mask, content);
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
    row.eventMode = item.canCraft ? "static" : "none";
    row.cursor = item.canCraft ? "pointer" : "default";
    row.addChild(makePixiPanel(rowWidth, ROW_HEIGHT, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10));

    const recipeDefinition = getHeroById(item.recipe.id);
    const namePrefix = item.canCraft ? "조합 가능 · " : "";
    const name = makePixiText(`${namePrefix}${item.recipe.displayName}`, 14, gradeColor(recipeDefinition?.grade));
    name.x = 12;
    name.y = 7;
    row.addChild(name);

    drawIngredientProgress(row, options, item.recipe, 32, rowWidth);

    if (item.canCraft) {
      row.on("pointerdown", stopPixiPropagation);
      row.on("pointerup", stopPixiPropagation);
      row.on("pointertap", (event: any) => {
        event.stopPropagation();
        options.onCraft(item.recipe.id);
      });
    }

    content.addChild(row);
  });

  bindVerticalDragScroll(viewport, content, viewportHeight, contentHeight);

  if (contentHeight > viewportHeight) {
    const hint = makePixiText("위아래로 드래그해서 더 보기", 9, 0xb7afa8);
    hint.anchor.set(0.5, 1);
    hint.x = width / 2;
    hint.y = height - 6;
    menu.addChild(hint);
  }

  return menu;
}
