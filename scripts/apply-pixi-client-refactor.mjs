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
  '} from "./pixiBoardView";\nimport { addPixiAnimation, tickPixiAnimations, type PixiAnimation } from "./animation/animationManager";\nimport { clearPixiContainer, makePixiPanel, makePixiText } from "./pixiSharedView";\nimport { getPixiPathPoint } from "./pixiPathRuntime";\n',
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
  `  const phase = Math.max(0, Math.min(1, progress)) * 4;
  if (phase < 1) return { x: left, y: bottom - (bottom - top) * phase };
  if (phase < 2) return { x: left + (right - left) * (phase - 1), y: top };
  if (phase < 3) return { x: right, y: top + (bottom - top) * (phase - 2) };
  return { x: right - (right - left) * (phase - 3), y: bottom };`,
  `  return getPixiPathPoint(layout, progress);`,
  "delegate path point",
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

writeFileSync(path, source);
console.log(`Updated ${path}`);
