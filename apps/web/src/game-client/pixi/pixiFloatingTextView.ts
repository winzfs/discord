import type { Container, Text } from "pixi.js";
import { makePixiText } from "./pixiSharedView";

export type FloatingTextAnimation = {
  age?: number;
  duration: number;
  update: (progress: number) => void;
  done: () => void;
};

const MAX_FLOATING_TEXT_POOL_SIZE = 48;
const DAMAGE_TEXT_COLOR = 0xff4b4b;
const CRITICAL_TEXT_COLOR = 0xffd166;
const REWARD_TEXT_COLOR = 0x5ee27a;
const floatingTextPool: Text[] = [];

const HIDDEN_BASE_SKILL_TEXTS = new Set([
  "공격",
  "약점",
  "폭발",
  "연쇄",
  "관통",
  "영역제어",
  "단일빙결",
  "단일제어",
  "표식",
  "지원",
  "포탑",
  "보상",
  "반격",
]);

function isDamageText(value: string) {
  return /^\d+$/.test(value.trim());
}

function isRewardText(value: string) {
  return /^\+\d+$/.test(value.trim()) || value.includes("보상") || value.includes("행운석 +");
}

function isCriticalColor(color: number) {
  return color === 0xffd166 || color === 0xfff06a || color === 0xffe066 || color === 0xffff66;
}

function shouldHideFloatingText(value: string) {
  return HIDDEN_BASE_SKILL_TEXTS.has(value.trim());
}

function normalizeFloatingTextColor(value: string, color: number) {
  if (isRewardText(value)) return REWARD_TEXT_COLOR;
  if (isDamageText(value)) return isCriticalColor(color) ? CRITICAL_TEXT_COLOR : DAMAGE_TEXT_COLOR;
  return color;
}

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
  if (shouldHideFloatingText(value)) {
    const hiddenText = makePixiText("", 1, 0x000000);
    hiddenText.visible = false;
    return {
      text: hiddenText,
      animation: {
        duration: 0,
        update: () => {},
        done: () => hiddenText.destroy({ children: true }),
      },
    };
  }

  const normalizedColor = normalizeFloatingTextColor(value, color);
  const floatingText = acquireFloatingText(value, normalizedColor);
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
