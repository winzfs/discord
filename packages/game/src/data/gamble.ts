import type { HeroGrade } from "../types/hero";

export type GambleSummonTier = {
  id: string;
  displayName: string;
  targetGrade: HeroGrade;
  costLuckStones: number;
  successRate: number;
  consolationGrade?: HeroGrade;
  description: string;
};

export const gambleSummonTiers: GambleSummonTier[] = [
  {
    id: "rare-gamble",
    displayName: "희귀 도박",
    targetGrade: "rare",
    costLuckStones: 1,
    successRate: 0.68,
    consolationGrade: "common",
    description: "낮은 비용으로 희귀 재료를 노리는 도박 소환입니다.",
  },
  {
    id: "epic-gamble",
    displayName: "영웅 도박",
    targetGrade: "epic",
    costLuckStones: 2,
    successRate: 0.38,
    consolationGrade: "rare",
    description: "신화 조합의 핵심 재료가 되는 영웅 등급을 노리는 도박 소환입니다.",
  },
  {
    id: "legendary-gamble",
    displayName: "전설 도박",
    targetGrade: "legendary",
    costLuckStones: 4,
    successRate: 0.16,
    consolationGrade: "epic",
    description: "강력한 신화 조합 재료를 얻기 위한 고위험 도박 소환입니다.",
  },
];

export function getGambleSummonTier(tierId: string): GambleSummonTier | null {
  return gambleSummonTiers.find((tier) => tier.id === tierId) ?? null;
}
