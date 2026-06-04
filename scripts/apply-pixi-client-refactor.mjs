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

replaceOnce(
  'import { Application, Container, Graphics, Rectangle, Text } from "pixi.js";',
  'import { Application, Container, Graphics, Rectangle } from "pixi.js";',
  "remove direct Text import",
);

replaceOnce(
  '} from "./pixiBoardView";\n',
  '} from "./pixiBoardView";\nimport { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";\nimport { createFloatingText } from "./pixiFloatingTextView";\nimport { mountPixiGameLayers } from "./pixiGameLayerOrder";\nimport { formatMythicRecipeText } from "./pixiMythicRecipeText";\nimport { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";\nimport { getPixiPathPoint } from "./pixiPathRuntime";\n',
  "add refactor imports",
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

replaceOnce(
  localMythicIngredientTextHelper,
  "",
  "remove local mythic ingredient text helper",
);

replaceOnce(
  `item.recipe.ingredients.map((ingredient) => ingredientText(ingredient.grade, ingredient.role, ingredient.count)).join(" + ")`,
  `formatMythicRecipeText(item.recipe.ingredients)`,
  "delegate mythic recipe text",
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

writeFileSync(path, source);
console.log(`Updated ${path}`);
