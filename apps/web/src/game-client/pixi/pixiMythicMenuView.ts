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
import { createVirtualScrollScheduler } from "./pixiVirtualScrollScheduler";
import { createMythicMenuRowPool, type MythicMenuRowViewModel } from "./pixiMythicMenuRowPool";

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

function createRowViewModel(item: MythicCraftItem, index: number, state: GameState): MythicMenuRowViewModel {
  const recipeDefinition = getHeroById(item.recipe.id);
  const progress = getMythicIngredientProgress(state, item.recipe);
  const summary = summarizeIngredientProgress(progress);

  return {
    index,
    recipeId: item.recipe.id,
    title: `${item.canCraft ? "조합 가능 · " : ""}${item.recipe.displayName}`,
    titleGrade: recipeDefinition?.grade,
    canCraft: item.canCraft,
    summary: `재료 ${summary.owned}/${summary.total}${summary.missing > 0 ? ` · 부족 ${summary.missing}` : " · 준비완료"}`,
    ingredients: progress.slice(0, 4).map((ingredient) => ({
      label: ingredient.label,
      grade: getIngredientGrade(ingredient),
      fulfilled: ingredient.fulfilled,
    })),
  };
}

function createLazyRowProvider(list: MythicCraftItem[], state: GameState) {
  const cache = new Map<number, MythicMenuRowViewModel>();

  return (index: number) => {
    if (index < 0 || index >= list.length) return null;
    const cached = cache.get(index);
    if (cached) return cached;

    const row = createRowViewModel(list[index], index, state);
    cache.set(index, row);
    return row;
  };
}

function createScrollViewport(width: number, height: number) {
  const viewport = new Container();
  const spacer = new Graphics();
  const mask = new Graphics();
  const hitArea = new Graphics();

  mask.rect(0, 0, width, height);
  mask.fill({ color: 0xffffff, alpha: 1 });

  hitArea.rect(0, 0, width, height);
  hitArea.fill({ color: 0x000000, alpha: 0.001 });

  viewport.addChild(hitArea, mask, spacer);
  return { viewport, spacer, mask };
}

function clampScroll(content: Container, maxScroll: number, nextY: number) {
  content.y = Math.max(-maxScroll, Math.min(0, nextY));
}

function bindVerticalDragScroll(
  viewport: Container,
  content: Container,
  viewportHeight: number,
  contentHeight: number,
  renderAtScrollTop: (scrollTop: number) => void,
) {
  const maxScroll = Math.max(0, contentHeight - viewportHeight);
  if (maxScroll <= 0) return;

  const scheduler = createVirtualScrollScheduler(() => renderAtScrollTop(Math.max(0, -content.y)));
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
  });
  viewport.on("pointerup", (event: any) => {
    event.stopPropagation();
    dragging = false;
    scheduler.request();
  });
  viewport.on("pointerupoutside", () => {
    dragging = false;
    scheduler.request();
  });
  viewport.on("wheel", (event: any) => {
    event.stopPropagation();
    clampScroll(content, maxScroll, content.y - event.deltaY * 0.45);
    scheduler.request();
  });
}

export function createPixiMythicMenuView(options: PixiMythicMenuViewOptions) {
  const list = getMythicCraftAvailability(options.state);
  const getRow = createLazyRowProvider(list, options.state);
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
  const { viewport, spacer, mask } = createScrollViewport(rowWidth, viewportHeight);
  viewport.x = 12;
  viewport.y = HEADER_HEIGHT;
  spacer.rect(0, 0, rowWidth, contentHeight);
  spacer.fill({ color: 0x000000, alpha: 0.001 });

  const rowPool = createMythicMenuRowPool({
    rowCount: list.length,
    getRow,
    rowWidth,
    rowHeight: ROW_HEIGHT,
    rowStep: ROW_STEP,
    viewportHeight,
    onCraft: options.onCraft,
  });
  rowPool.root.mask = mask;
  viewport.addChild(rowPool.root);
  menu.addChild(viewport);

  bindVerticalDragScroll(viewport, rowPool.root, viewportHeight, contentHeight, rowPool.render);

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
