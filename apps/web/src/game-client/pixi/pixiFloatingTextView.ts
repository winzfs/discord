import type { Container, Text } from "pixi.js";
import { makePixiText } from "./pixiSharedView";

export type FloatingTextAnimation = {
  age?: number;
  duration: number;
  update: (progress: number) => void;
  done: () => void;
};

export function removeEffectChild(effects: Container, child: any) {
  if (!child || child.destroyed) return;
  effects.removeChild(child);
  child.destroy({ children: true });
}

export function cleanupEffectLayer(effects: Container) {
  for (const child of [...effects.children]) {
    if ((child as any).destroyed) effects.removeChild(child);
  }
}

export function createFloatingText(
  effects: Container,
  value: string,
  x: number,
  y: number,
  color: number,
): { text: Text; animation: FloatingTextAnimation } {
  const floatingText = makePixiText(value, 22, color);
  floatingText.label = "floating-text";
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  effects.addChild(floatingText);

  let removed = false;
  const removeFloatingText = () => {
    if (removed) return;
    removed = true;
    removeEffectChild(effects, floatingText);
  };

  window.setTimeout(removeFloatingText, 250);

  return {
    text: floatingText,
    animation: {
      duration: 250,
      update: (progress) => {
        if (removed || floatingText.destroyed) return;
        floatingText.y = y - progress * 14;
        floatingText.alpha = Math.max(0, 1 - progress);
        floatingText.scale.set(1 + progress * 0.03);
      },
      done: removeFloatingText,
    },
  };
}
