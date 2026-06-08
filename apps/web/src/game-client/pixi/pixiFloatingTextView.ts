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
const DEFAULT_FLOATING_TEXT_DURATION_MS = 250;
const WAVE_RESULT_TEXT_DURATION_MS = 2200;
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

function isWaveResultText(value: string) {
  const normalized = value.trim();
  return (
    normalized.includes("완벽 방어") ||
    normalized.includes("누수") ||
    normalized.includes("패배") ||
    normalized.startsWith("처치 ") ||
    normalized.startsWith("처치 보상") ||
    normalized.startsWith("코인 이자")
  );
}

function getFloatingTextDuration(value: string) {
  return isWaveResultText(value) ? WAVE_RESULT_TEXT_DURATION_MS : DEFAULT_FLOATING_TEXT_DURATION_MS;
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

  const duration = getFloatingTextDuration(value);
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

  window.setTimeout(removeFloatingText, duration);

  return {
    text: floatingText,
    animation: {
      duration,
      update: (progress) => {
        if (removed || floatingText.destroyed) return;
        const holdRatio = isWaveResultText(value) ? 0.72 : 0;
        const fadeProgress = progress <= holdRatio ? 0 : (progress - holdRatio) / Math.max(0.001, 1 - holdRatio);
        floatingText.y = y - progress * (isWaveResultText(value) ? 28 : 14);
        floatingText.alpha = Math.max(0, 1 - fadeProgress);
        floatingText.scale.set(1 + progress * (isWaveResultText(value) ? 0.06 : 0.03));
      },
      done: removeFloatingText,
    },
  };
}
