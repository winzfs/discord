import type { Container, Text } from "pixi.js";
import { makePixiText } from "./pixiSharedView";

export type FloatingTextAnimation = {
  duration: number;
  update: (progress: number) => void;
  done: () => void;
};

export function createFloatingText(
  effects: Container,
  value: string,
  x: number,
  y: number,
  color: number,
): { text: Text; animation: FloatingTextAnimation } {
  const floatingText = makePixiText(value, 22, color);
  floatingText.anchor.set(0.5);
  floatingText.x = x;
  floatingText.y = y;
  effects.addChild(floatingText);

  return {
    text: floatingText,
    animation: {
      duration: 420,
      update: (progress) => {
        floatingText.y = y - progress * 28;
        floatingText.alpha = Math.max(0, 1 - progress);
        floatingText.scale.set(1 + progress * 0.08);
      },
      done: () => {
        effects.removeChild(floatingText);
        floatingText.destroy();
      },
    },
  };
}
