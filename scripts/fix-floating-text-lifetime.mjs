import { readFileSync, writeFileSync } from "node:fs";

const path = "apps/web/src/game-client/pixi/createPixiGame.ts";
let s = readFileSync(path, "utf8");

if (!s.includes('import { cleanupEffectLayer, createFloatingText, removeEffectChild } from "./pixiFloatingTextView";')) {
  s = s.replace(
    'import { colors } from "./gameTheme";',
    'import { cleanupEffectLayer, createFloatingText, removeEffectChild } from "./pixiFloatingTextView";\nimport { colors } from "./gameTheme";',
  );
}

const variants = [
`function removeEffectChild(refs: GameRefs, child: any) {
  if (!child || child.destroyed) return;
  refs.effects.removeChild(child);
  child.destroy({ children: true });
}

function cleanupEffects(refs: GameRefs) {
  for (const child of [...refs.effects.children]) {
    if ((child as any).destroyed) {
      refs.effects.removeChild(child);
    }
  }
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const floatingText = makeText(value, 22, color);
  floatingText.label = "floating-text";
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  refs.effects.addChild(floatingText);

  let removed = false;
  const removeFloatingText = () => {
    if (removed) return;
    removed = true;
    removeEffectChild(refs, floatingText);
  };

  window.setTimeout(removeFloatingText, 250);

  addAnimation(refs, {
    duration: 250,
    update: (progress) => {
      if (removed || floatingText.destroyed) return;
      floatingText.y = y - progress * 14;
      floatingText.alpha = Math.max(0, 1 - progress);
      floatingText.scale.set(1 + progress * 0.03);
    },
    done: removeFloatingText,
  });
}`,
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
}`
];

const replacement = `function cleanupEffects(refs: GameRefs) {
  cleanupEffectLayer(refs.effects);
}

function floatText(refs: GameRefs, value: string, x: number, y: number, color: number) {
  const { animation } = createFloatingText(refs.effects, value, x, y, color);
  addAnimation(refs, animation);
}`;

let replaced = false;
for (const variant of variants) {
  if (s.includes(variant)) {
    s = s.replace(variant, replacement);
    replaced = true;
    break;
  }
}

if (!replaced && !s.includes("createFloatingText(refs.effects")) {
  throw new Error("floatText block not found");
}

const beforeProjectileDestroy = `        projectile.destroy();`;
const afterProjectileDestroy = `        removeEffectChild(refs.effects, projectile);`;
if (s.includes(beforeProjectileDestroy) && !s.includes(afterProjectileDestroy)) {
  s = s.replaceAll(beforeProjectileDestroy, afterProjectileDestroy);
}

if (!s.includes("cleanupEffects(refs);")) {
  s = s.replace(
    `function tick(refs: GameRefs, deltaMs: number) {
  const deltaSeconds = deltaMs / 1000;`,
    `function tick(refs: GameRefs, deltaMs: number) {
  cleanupEffects(refs);
  const deltaSeconds = deltaMs / 1000;`,
  );
}

writeFileSync(path, s);
console.log(`Hardened ${path} effect cleanup`);
