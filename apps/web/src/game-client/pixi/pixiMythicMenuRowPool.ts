import { Container, Graphics, Text } from "pixi.js";
import type { HeroGrade } from "@discord-random-defense/game";
import { colors, gradeColor } from "./gameTheme";
import { makePixiText } from "./pixiSharedView";

export type MythicMenuIngredientViewModel = {
  label: string;
  grade?: HeroGrade;
  fulfilled: boolean;
};

export type MythicMenuRowViewModel = {
  index: number;
  recipeId: string;
  title: string;
  titleGrade?: HeroGrade;
  canCraft: boolean;
  summary: string;
  ingredients: MythicMenuIngredientViewModel[];
};

export type MythicMenuRowPool = {
  root: Container;
  render: (scrollTop: number) => void;
};

const GRADE_LABEL_WIDTH = 38;
const INGREDIENT_FONT_SIZE = 11;
const TAP_MOVE_CANCEL_DISTANCE = 8;
const INGREDIENT_START_Y = 66;
const INGREDIENT_ROW_GAP = 25;

type RowSlot = {
  root: Container;
  panel: Graphics;
  title: Text;
  craftHint: Text;
  summary: Text;
  marks: Text[];
  labelBackgrounds: Graphics[];
  labelShadows: Text[];
  labelTexts: Text[];
  names: Text[];
  boundRecipeId: string | null;
  visibleIndex: number;
  lastCanCraft: boolean | null;
  lastIngredientKeys: string[];
};

function gradeLabel(grade: HeroGrade | undefined) {
  if (grade === "mythic") return "신화";
  if (grade === "legendary") return "전설";
  if (grade === "epic") return "영웅";
  if (grade === "rare") return "희귀";
  return "일반";
}

function drawRowPanel(panel: Graphics, width: number, height: number, canCraft: boolean) {
  panel.clear();
  panel.roundRect(0, 0, width, height, 10);
  panel.fill({ color: canCraft ? 0x7a5528 : 0x655e59, alpha: 1 });
  panel.stroke({ color: canCraft ? 0xffb347 : 0x3d332e, width: 2, alpha: 1 });
}

function drawGradeBackground(background: Graphics, grade: HeroGrade | undefined, fulfilled: boolean) {
  background.clear();
  background.roundRect(0, 1, GRADE_LABEL_WIDTH, 15, 5);
  background.fill({ color: gradeColor(grade), alpha: fulfilled ? 1 : 0.86 });
  background.stroke({ color: 0x211812, width: 1.2, alpha: 0.72 });
}

function setText(text: Text, value: string, fill?: number) {
  if (text.text !== value) text.text = value;
  if (fill !== undefined && text.style.fill !== fill) text.style.fill = fill;
}

function createText(value: string, size: number, fill: number) {
  return makePixiText(value, size, fill) as Text;
}

function createRowSlot(rowWidth: number, rowHeight: number, rowStep: number, onCraft: (recipeId: string) => void): RowSlot {
  const root = new Container();
  const panel = new Graphics();
  const title = createText("", 16, colors.white);
  const craftHint = createText("터치", 11, 0xfff2a8);
  const summary = createText("", 13, 0xf0e8dd);
  const marks: Text[] = [];
  const labelBackgrounds: Graphics[] = [];
  const labelShadows: Text[] = [];
  const labelTexts: Text[] = [];
  const names: Text[] = [];

  root.addChild(panel);

  title.x = 12;
  title.y = 8;
  root.addChild(title);

  craftHint.anchor.set(1, 0);
  craftHint.x = rowWidth - 12;
  craftHint.y = 10;
  root.addChild(craftHint);

  summary.x = 12;
  summary.y = 39;
  root.addChild(summary);

  const columnWidth = Math.floor((rowWidth - 30) / 2);
  for (let index = 0; index < 4; index += 1) {
    const x = 12 + (index % 2) * columnWidth;
    const y = INGREDIENT_START_Y + Math.floor(index / 2) * INGREDIENT_ROW_GAP;

    const mark = createText("", INGREDIENT_FONT_SIZE, 0xd8d0c8);
    mark.x = x;
    mark.y = y;
    root.addChild(mark);
    marks.push(mark);

    const background = new Graphics();
    background.x = x + 10;
    background.y = y;
    root.addChild(background);
    labelBackgrounds.push(background);

    const shadow = createText("", 9, 0x17110f);
    shadow.anchor.set(0.5, 0);
    shadow.x = x + 10 + GRADE_LABEL_WIDTH / 2 + 1;
    shadow.y = y + 3;
    shadow.alpha = 0.62;
    root.addChild(shadow);
    labelShadows.push(shadow);

    const labelText = createText("", 9, colors.white);
    labelText.anchor.set(0.5, 0);
    labelText.x = x + 10 + GRADE_LABEL_WIDTH / 2;
    labelText.y = y + 2;
    root.addChild(labelText);
    labelTexts.push(labelText);

    const name = createText("", INGREDIENT_FONT_SIZE, 0xf0e8dd);
    name.x = x + 10 + GRADE_LABEL_WIDTH + 4;
    name.y = y;
    root.addChild(name);
    names.push(name);
  }

  let downX = 0;
  let downY = 0;
  let moved = false;
  root.eventMode = "static";
  root.cursor = "pointer";
  root.on("pointerdown", (event: any) => {
    downX = event.global.x;
    downY = event.global.y;
    moved = false;
  });
  root.on("pointermove", (event: any) => {
    if (Math.abs(event.global.x - downX) > TAP_MOVE_CANCEL_DISTANCE || Math.abs(event.global.y - downY) > TAP_MOVE_CANCEL_DISTANCE) {
      moved = true;
    }
  });
  root.on("pointerup", (event: any) => {
    const recipeId = (root as any).__recipeId as string | undefined;
    const canCraft = (root as any).__canCraft as boolean | undefined;
    if (moved || !canCraft || !recipeId) return;
    event.stopPropagation();
    onCraft(recipeId);
  });

  root.visible = false;
  root.y = -rowStep * 2;
  return {
    root,
    panel,
    title,
    craftHint,
    summary,
    marks,
    labelBackgrounds,
    labelShadows,
    labelTexts,
    names,
    boundRecipeId: null,
    visibleIndex: -1,
    lastCanCraft: null,
    lastIngredientKeys: ["", "", "", ""],
  };
}

function ingredientKey(ingredient: MythicMenuIngredientViewModel | undefined) {
  if (!ingredient) return "empty";
  return `${ingredient.label}|${ingredient.grade ?? "common"}|${ingredient.fulfilled ? "1" : "0"}`;
}

function updateRowSlot(slot: RowSlot, item: MythicMenuRowViewModel, rowWidth: number, rowHeight: number, rowStep: number) {
  const isSameRecipe = slot.boundRecipeId === item.recipeId;
  slot.root.visible = true;
  slot.root.y = item.index * rowStep;
  slot.visibleIndex = item.index;
  slot.boundRecipeId = item.recipeId;
  (slot.root as any).__recipeId = item.recipeId;
  (slot.root as any).__canCraft = item.canCraft;

  if (slot.lastCanCraft !== item.canCraft) {
    drawRowPanel(slot.panel, rowWidth, rowHeight, item.canCraft);
    slot.lastCanCraft = item.canCraft;
  }

  setText(slot.title, item.title, gradeColor(item.titleGrade));
  setText(slot.summary, item.summary, item.summary.includes("준비완료") ? 0xfff2a8 : 0xf0e8dd);
  slot.craftHint.visible = item.canCraft;

  for (let index = 0; index < 4; index += 1) {
    const ingredient = item.ingredients[index];
    const key = ingredientKey(ingredient);
    const visible = Boolean(ingredient);
    slot.marks[index].visible = visible;
    slot.labelBackgrounds[index].visible = visible;
    slot.labelShadows[index].visible = visible;
    slot.labelTexts[index].visible = visible;
    slot.names[index].visible = visible;

    if (!ingredient) {
      slot.lastIngredientKeys[index] = key;
      continue;
    }

    if (isSameRecipe && slot.lastIngredientKeys[index] === key) continue;
    slot.lastIngredientKeys[index] = key;

    setText(slot.marks[index], ingredient.fulfilled ? "✓" : "·", ingredient.fulfilled ? 0xfff2a8 : 0xd8d0c8);
    drawGradeBackground(slot.labelBackgrounds[index], ingredient.grade, ingredient.fulfilled);
    setText(slot.labelShadows[index], gradeLabel(ingredient.grade));
    setText(slot.labelTexts[index], gradeLabel(ingredient.grade), colors.white);
    slot.labelTexts[index].alpha = ingredient.fulfilled ? 1 : 0.96;
    setText(slot.names[index], ingredient.label, ingredient.fulfilled ? 0xfff2a8 : 0xf0e8dd);
    slot.names[index].alpha = ingredient.fulfilled ? 1 : 0.92;
  }
}

export function createMythicMenuRowPool(args: {
  rowCount: number;
  getRow: (index: number) => MythicMenuRowViewModel | null;
  rowWidth: number;
  rowHeight: number;
  rowStep: number;
  viewportHeight: number;
  onCraft: (recipeId: string) => void;
}): MythicMenuRowPool {
  const root = new Container();
  const visibleSlotCount = Math.min(
    args.rowCount,
    Math.ceil(args.viewportHeight / args.rowStep) + 3,
  );
  const slots = Array.from({ length: visibleSlotCount }, () => createRowSlot(args.rowWidth, args.rowHeight, args.rowStep, args.onCraft));
  slots.forEach((slot) => root.addChild(slot.root));

  let renderedStart = -1;
  let renderedEnd = -1;

  function render(scrollTop: number) {
    const start = Math.max(0, Math.floor(scrollTop / args.rowStep) - 1);
    const end = Math.min(args.rowCount - 1, start + visibleSlotCount - 1);
    if (start === renderedStart && end === renderedEnd) return;

    renderedStart = start;
    renderedEnd = end;

    slots.forEach((slot, slotIndex) => {
      const rowIndex = start + slotIndex;
      const item = args.getRow(rowIndex);
      if (!item) {
        slot.root.visible = false;
        slot.visibleIndex = -1;
        return;
      }
      updateRowSlot(slot, item, args.rowWidth, args.rowHeight, args.rowStep);
    });
  }

  render(0);
  return { root, render };
}
