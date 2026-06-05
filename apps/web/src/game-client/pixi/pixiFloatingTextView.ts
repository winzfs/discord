import type { Container, Text } from "pixi.js";
import { makePixiText } from "./pixiSharedView";

export type FloatingTextAnimation = {
  age?: number;
  duration: number;
  update: (progress: number) => void;
  done: () => void;
};

const MAX_FLOATING_TEXT_POOL_SIZE = 48;
const floatingTextPool: Text[] = [];

function acquireFloatingText(value: string, color: number) {
  const text = floatingTextPool.pop() ?? makePixiText(value, 22, color);

  text.text = value;
  text.style.fill = color;
  text.label = "floating-text";
  text.anchor.set(0.5);
  text.alpha = 1;
  text.visible = true;
  text.scale.set(1);

  return text;
}

function releaseFloatingText(effects: Container, text: Text) {
  if (!text || text.destroyed) return;

  if (text.parent) text.parent.removeChild(text);
  text.visible = false;
  text.alpha = 0;
  text.scale.set(1);

  if (floatingTextPool.length < MAX_FLOATING_TEXT_POOL_SIZE) {
    floatingTextPool.push(text);
    return;
  }

  text.destroy({ children: true });
}

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
  const floatingText = acquireFloatingText(value, color);
  floatingText.x = x;
  floatingText.y = y;
  effects.addChild(floatingText);

  let removed = false;
  const removeFloatingText = () => {
    if (removed) return;
    removed = true;
    releaseFloatingText(effects, floatingText);
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
