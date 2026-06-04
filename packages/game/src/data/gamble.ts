import type { HeroGrade } from "../types/hero";

export type GambleTier = {
  id: string;
  displayName: string;
  targetGrade: HeroGrade;
  costLuckStones: number;
  successRate: number;
  fallbackGrade?: HeroGrade;
  description: string;
};

export const gambleTiers: GambleTier[] = [
  {
    id: "rare-gamble",
    displayName: "희귀 도박",
    targetGrade: "rare",
    costLuckStones: 1,
    successRate: 0.68,
    fallbackGrade: "common",
    description: "낮은 비용으로 희귀 전력을 노리는 도박입니다.",
  },
  {
    id: "epic-gamble",
    displayName: "영웅 도박",
    targetGrade: "epic",
    costLuckStones: 2,
    successRate: 0.38,
    fallbackGrade: "rare",
    description: "오버드라이브 제작 재료가 되는 영웅 전력을 노리는 도박입니다.",
  },
  {
    id: "legendary-gamble",
    displayName: "전설 도박",
    targetGrade: "legendary",
    costLuckStones: 4,
    successRate: 0.16,
    fallbackGrade: "epic",
    description: "강력한 오버드라이브 재료를 얻기 위한 고위험 도박입니다.",
  },
];

export function getGambleTier(tierId: string): GambleTier | null {
  return gambleTiers.find((tier) => tier.id === tierId) ?? null;
}
