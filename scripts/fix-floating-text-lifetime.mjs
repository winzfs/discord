import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

const beforeFloat = `function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
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
}`;

const afterFloat = `function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const floatingText = makeText(value, 22, color);
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  refs.effects.addChild(floatingText);
  addAnimation(refs, {
    duration: 420,
    update: (progress) => {
      floatingText.y = y - progress * 28;
      floatingText.alpha = Math.max(0, 1 - progress);
      floatingText.scale.set(1 + progress * 0.08);
    },
    done: () => {
      refs.effects.removeChild(floatingText);
      floatingText.destroy();
    },
  });
}`;

if (!s.includes(beforeFloat) && !s.includes(afterFloat)) {
  throw new Error("floatText block not found");
}

s = s.replace(beforeFloat, afterFloat);
s = s.replaceAll("projectile.destroy();", "refs.effects.removeChild(projectile);\n        projectile.destroy();");
s = s.replaceAll("warning.destroy()", "refs.effects.removeChild(warning);\n      warning.destroy()");

writeFileSync(path, s);
console.log(`Updated ${path} floating text lifetime`);
