import type { HeroGrade } from "../types/hero";

export type OverchipCallTier = {
  id: string;
  displayName: string;
  targetGrade: HeroGrade;
  costOverchips: number;
  successRate: number;
  fallbackGrade?: HeroGrade;
  description: string;
};

export const overchipCallTiers: OverchipCallTier[] = [
  {
    id: "blue-signal",
    displayName: "블루 시그널",
    targetGrade: "rare",
    costOverchips: 1,
    successRate: 0.68,
    fallbackGrade: "common",
    description: "낮은 비용으로 희귀 전력을 노리는 오버칩 호출입니다.",
  },
  {
    id: "purple-signal",
    displayName: "퍼플 시그널",
    targetGrade: "epic",
    costOverchips: 2,
    successRate: 0.38,
    fallbackGrade: "rare",
    description: "오버드라이브 제작 재료가 되는 영웅 전력을 노리는 호출입니다.",
  },
  {
    id: "gold-signal",
    displayName: "골드 시그널",
    targetGrade: "legendary",
    costOverchips: 4,
    successRate: 0.16,
    fallbackGrade: "epic",
    description: "강력한 오버드라이브 재료를 얻기 위한 고위험 호출입니다.",
  },
];

export function getOverchipCallTier(tierId: string): OverchipCallTier | null {
  return overchipCallTiers.find((tier) => tier.id === tierId) ?? null;
}
