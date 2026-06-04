import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let source = readFileSync(path, "utf8");

function replaceOnce(before, after, label) {
  if (!source.includes(before)) {
    console.log(`[skip] ${label}`);
    return;
  }
  source = source.replace(before, after);
  console.log(`[ok] ${label}`);
}

function addImportBlockOnce(anchor, block, label) {
  const firstLine = block.trim().split("\n")[0];
  if (source.includes(firstLine)) {
    console.log(`[skip] ${label}`);
    return;
  }
  replaceOnce(anchor, `${anchor}${block}`, label);
}

function repairKnownMultilineImports() {
  const repairs = [
    {
      label: "repair hud import",
      before: 'import { colors } from "./gameTheme";\n  createPixiHudView,',
      after: 'import { colors } from "./gameTheme";\nimport {\n  createPixiHudView,',
    },
    {
      label: "repair controls import",
      before: '} from "./pixiHudView";\n  createPixiControlsView,',
      after: '} from "./pixiHudView";\nimport {\n  createPixiControlsView,',
    },
    {
      label: "repair enemy import",
      before: '} from "./pixiControlsView";\n  createEnemyView,',
      after: '} from "./pixiControlsView";\nimport {\n  createEnemyView,',
    },
    {
      label: "repair board import",
      before: '} from "./pixiEnemyView";\n  createUnitGhost as createBoardUnitGhost,',
      after: '} from "./pixiEnemyView";\nimport {\n  createUnitGhost as createBoardUnitGhost,',
    },
  ];

  for (const repair of repairs) {
    replaceOnce(repair.before, repair.after, repair.label);
  }
}

function dedupeSingleLineImports() {
  const lines = source.split("\n");
  const seen = new Set();
  let changed = false;
  source = lines
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("import ") || trimmed === "import {" || !trimmed.endsWith(";")) {
        return true;
      }
      if (!seen.has(trimmed)) {
        seen.add(trimmed);
        return true;
      }
      changed = true;
      return false;
    })
    .join("\n");
  console.log(changed ? "[ok] remove duplicate single-line imports" : "[skip] remove duplicate single-line imports");
}

repairKnownMultilineImports();

replaceOnce(
  'import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";',
  'import { Application, Container, Graphics, Rectangle } from "pixi.js";',
  "remove direct Text import",
);

addImportBlockOnce(
  '} from "./pixiBoardView";\n',
  'import { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";\nimport { createFloatingText } from "./pixiFloatingTextView";\nimport { mountPixiGameLayers } from "./pixiGameLayerOrder";\nimport { createPixiMythicMenuView } from "./pixiMythicMenuView";\nimport { formatMythicRecipeText } from "./pixiMythicRecipeText";\nimport { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";\nimport { getPixiPathPoint } from "./pixiPathRuntime";\n',
  "add refactor imports",
);

addImportBlockOnce(
  'import { mountPixiGameLayers } from "./pixiGameLayerOrder";\n',
  'import { createPixiMythicMenuView } from "./pixiMythicMenuView";\n',
  "add mythic menu import",
);

replaceOnce(
  `type Animation = {
  age: number;
  duration: number;
  update: (progress: number) => void;
  done?: () => void;
};`,
  `type Animation = PixiAnimation;`,
  "replace animation type",
);

replaceOnce(
  `  controls: Container;
  effects: Container;
  menuLayer: Container;`,
  `  controls: Container;
  info: Container;
  effects: Container;
  menuLayer: Container;`,
  "add info layer ref",
);

replaceOnce(
  `function makeText(value: string, size = 18, fill: number = colors.white) {
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
}`,
  `function makeText(value: string, size = 18, fill: number = colors.white) {
  return makePixiText(value, size, fill);
}`,
  "delegate text helper",
);

replaceOnce(
  `function makePanel(width: number, height: number, fill: number, stroke = colors.panelDark, radius = 16) {
  const panel = new Graphics();
  panel.roundRect(0, 0, width, height, radius);
  panel.fill({ color: fill, alpha: 1 });
  panel.stroke({ color: stroke, width: 3, alpha: 0.9 });
  return panel;
}`,
  `function makePanel(width: number, height: number, fill: number, stroke = colors.panelDark, radius = 16) {
  return makePixiPanel(width, height, fill, stroke, radius);
}`,
  "delegate panel helper",
);

replaceOnce(
  `function clear(container: Container) {
  container.removeChildren();
}`,
  `function clear(container: Container) {
  clearPixiContainer(container);
}`,
  "delegate clear helper",
);

replaceOnce(
  `function addAnimation(refs: GameRefs, animation: Omit<Animation, "age">) {
  refs.animations.push({ ...animation, age: 0 });
}`,
  `function addAnimation(refs: GameRefs, animation: Omit<Animation, "age">) {
  addPixiAnimation(refs.animations, animation);
}`,
  "delegate animation add",
);

replaceOnce(
  `function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const floatingText = makeText(value, 22, color);
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  refs.effects.addChild(floatingText);
  addAnimation(refs, {
    duration: 700,
    update: (progress) => {
      floatingText.y = y - progress * 46;
      floatingText.alpha = 1 - progress;
      floatingText.scale.set(1 + progress * 0.2);
    },
    done: () => floatingText.destroy(),
  });
}`,
  `function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const { animation } = createFloatingText(refs.effects, value, x, y, color);
  addAnimation(refs, animation);
}`,
  "delegate floating text",
);

replaceOnce(
  `  const phase = Math.max(0, Math.min(1, progress)) * 4;
  if (phase < 1) return { x: left, y: bottom - (bottom - top) * phase };
  if (phase < 2) return { x: left + (right - left) * (phase - 1), y: top };
  if (phase < 3) return { x: right, y: top + (bottom - top) * (phase - 2) };
  return { x: right - (right - left) * (phase - 3), y: bottom };`,
  `  return getPixiPathPoint(layout, progress);`,
  "delegate path point",
);

const localMythicIngredientTextHelper = [
  'function ingredientText(grade: string, role: string | undefined, count: number) {',
  '  const gradeLabel = grade === "legendary" ? "전설" : grade === "epic" ? "영웅" : grade === "rare" ? "희귀" : grade === "common" ? "일반" : "신화";',
  '  const roleLabel = role === "damage" ? "딜러" : role === "tank" ? "탱커" : role === "support" ? "지원" : "무관";',
  '  return `${gradeLabel} ${roleLabel}x${count}`;',
  '}',
  '',
].join("\n");

replaceOnce(localMythicIngredientTextHelper, "", "remove local mythic ingredient text helper");

replaceOnce(
  `item.recipe.ingredients.map((ingredient) => ingredientText(ingredient.grade, ingredient.role, ingredient.count)).join(" + ")`,
  `formatMythicRecipeText(item.recipe.ingredients)`,
  "delegate mythic recipe text",
);

replaceOnce(
  `function showMythicMenu(refs: GameRefs) {
  clearMenu(refs);
  const list = getMythicCraftAvailability(refs.state);
  const width = Math.min(360, refs.app.renderer.width - 24);
  const height = 72 + list.length * 54;
  const menu = new Container();
  menu.x = refs.app.renderer.width / 2 - width / 2;
  menu.y = Math.max(18, refs.app.renderer.height * 0.14);
  menu.addChild(makePanel(width, height, 0x2d2925, colors.orange, 16));

  const title = makeText("신화 조합", 19, colors.yellow);
  title.anchor.set(0.5, 0);
  title.x = width / 2;
  title.y = 14;
  menu.addChild(title);
  menu.addChild(makeMenuButton("닫기", width - 70, 12, true, () => clearMenu(refs)));

  list.forEach((item, index) => {
    const y = 58 + index * 54;
    const row = new Container();
    row.x = 12;
    row.y = y;
    row.eventMode = item.canCraft ? "static" : "none";
    row.cursor = item.canCraft ? "pointer" : "default";
    row.addChild(makePanel(width - 24, 46, item.canCraft ? colors.orange : 0x655e59, item.canCraft ? 0x51351e : 0x3d332e, 10));

    const name = makeText(item.recipe.displayName, 14, item.canCraft ? colors.white : 0xb7afa8);
    name.x = 12;
    name.y = 5;
    row.addChild(name);

    const recipe = makeText(formatMythicRecipeText(item.recipe.ingredients), 10, item.canCraft ? colors.yellow : 0xb7afa8);
    recipe.x = 12;
    recipe.y = 25;
    row.addChild(recipe);

    if (item.canCraft) {
      row.on("pointertap", (event: any) => {
        event.stopPropagation();
        mythicCraftAction(refs, item.recipe.id);
      });
    }
    menu.addChild(row);
  });

  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}`,
  `function showMythicMenu(refs: GameRefs) {
  clearMenu(refs);
  const menu = createPixiMythicMenuView({
    state: refs.state,
    rendererWidth: refs.app.renderer.width,
    rendererHeight: refs.app.renderer.height,
    onClose: () => clearMenu(refs),
    onCraft: (recipeId) => mythicCraftAction(refs, recipeId),
  });
  refs.menuLayer.addChild(menu);
  refs.menu = menu;
}`,
  "delegate mythic menu view",
);

replaceOnce(
  `  refs.animations = refs.animations.filter((animation) => {
    animation.age += deltaMs;
    const progress = Math.min(1, animation.age / animation.duration);
    animation.update(progress);
    if (progress >= 1) {
      animation.done?.();
      return false;
    }
    return true;
  });`,
  `  refs.animations = tickPixiAnimations(refs.animations, deltaMs);`,
  "delegate animation tick",
);

replaceOnce(
  `    controls: new Container(),
    effects: new Container(),
    menuLayer: new Container(),`,
  `    controls: new Container(),
    info: new Container(),
    effects: new Container(),
    menuLayer: new Container(),`,
  "create info layer",
);

replaceOnce(
  `    stage.addChild(refs.world, refs.board, refs.hud, refs.controls, refs.effects, refs.menuLayer);`,
  `    mountPixiGameLayers(stage, {
      world: refs.world,
      board: refs.board,
      hud: refs.hud,
      controls: refs.controls,
      info: refs.info,
      effects: refs.effects,
      menuLayer: refs.menuLayer,
    });`,
  "delegate layer mounting",
);

dedupeSingleLineImports();

writeFileSync(path, source);
console.log(`Updated ${path}`);
