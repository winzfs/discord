import { Container } from "pixi.js";
import { getMythicCraftAvailability, getMythicIngredientProgress, type GameState } from "@discord-random-defense/game";
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

function getIngredientTextColor(item: ReturnType<typeof getMythicIngredientProgress>[number]) {
  if (item.fulfilled) return 0xfff2a8;
  if (item.owned > 0) return 0xffe16b;
  return 0xb7afa8;
}

function drawIngredientProgress(row: Container, options: PixiMythicMenuViewOptions, recipe: ReturnType<typeof getMythicCraftAvailability>[number]["recipe"], y: number) {
  const progress = getMythicIngredientProgress(options.state, recipe);
  let x = 12;

  progress.forEach((item) => {
    const mark = item.fulfilled ? "✓" : item.owned > 0 ? "보유" : "부족";
    const value = `${mark} ${item.label} ${Math.min(item.owned, item.required)}/${item.required}`;
    const ingredient = makePixiText(value, 9, getIngredientTextColor(item));

    ingredient.x = x;
    ingredient.y = y;
    row.addChild(ingredient);

    x += ingredient.width + 14;
  });
}

export function createPixiMythicMenuView(options: PixiMythicMenuViewOptions) {
  const list = getMythicCraftAvailability(options.state);
  const width = Math.min(360, options.rendererWidth - 24);
  const rowHeight = 58;
  const height = 72 + list.length * rowHeight;
  const menu = new Container();
  menu.x = options.rendererWidth / 2 - width / 2;
  menu.y = Math.max(18, options.rendererHeight * 0.14);
  makePixiTouchBoundary(menu, width, height);
  menu.addChild(makePixiPanel(width, height, 0x2d2925, colors.orange, 16));

  const title = makePixiText("신화 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 14;
  menu.addChild(title);
  menu.addChild(createMythicMenuButton("닫기", width - 70, 12, options.onClose));

  list.forEach((item, index) => {
    const y = 58 + index * rowHeight;
    const row = new Container();
    row.x = 12;
    row.y = y;
    row.eventMode = item.canCraft ? "static" : "none";
    row.cursor = item.canCraft ? "pointer" : "default";
    row.addChild(makePixiPanel(width - 24, 50, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10));

    const namePrefix = item.canCraft ? "조합 가능 · " : "";
    const name = makePixiText(`${namePrefix}${item.recipe.displayName}`, 14, item.canCraft ? colors.white : 0xb7afa8);
    name.x = 12;
    name.y = 5;
    row.addChild(name);

    drawIngredientProgress(row, options, item.recipe, 27);

    if (item.canCraft) {
      row.on("pointerdown", stopPixiPropagation);
      row.on("pointerup", stopPixiPropagation);
      row.on("pointertap", (event: any) => {
        event.stopPropagation();
        options.onCraft(item.recipe.id);
      });
    }

    menu.addChild(row);
  });

  return menu;
}
