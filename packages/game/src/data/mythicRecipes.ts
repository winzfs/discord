import type { HeroGrade, HeroRole } from "../types/hero";

export type MythicRecipeIngredient = {
  grade: HeroGrade;
  role?: HeroRole;
  count: number;
};

export type MythicRecipeDefinition = {
  id: string;
  displayName: string;
  role: HeroRole;
  attackStyle: "physical" | "magic" | "control" | "support" | "economy";
  ingredients: MythicRecipeIngredient[];
  description: string;
};

export const mythicRecipes: MythicRecipeDefinition[] = [
  {
    id: "mythic-sharpshooter",
    displayName: "신화 명사수",
    role: "damage",
    attackStyle: "physical",
    ingredients: [
      { grade: "epic", role: "damage", count: 2 },
      { grade: "rare", role: "support", count: 1 },
    ],
    description: "초중반 보스 처리를 담당하는 물리 단일 딜러입니다.",
  },
  {
    id: "mythic-storm-caller",
    displayName: "신화 폭풍술사",
    role: "damage",
    attackStyle: "magic",
    ingredients: [
      { grade: "epic", role: "damage", count: 1 },
      { grade: "epic", role: "support", count: 1 },
      { grade: "rare", role: "damage", count: 1 },
    ],
    description: "광역 마법 피해로 웨이브 정리를 담당합니다.",
  },
  {
    id: "mythic-shield-anchor",
    displayName: "신화 방벽대장",
    role: "tank",
    attackStyle: "control",
    ingredients: [
      { grade: "epic", role: "tank", count: 2 },
      { grade: "rare", role: "damage", count: 1 },
    ],
    description: "라인을 늦추고 코어 피해를 줄이는 제어형 신화 유닛입니다.",
  },
  {
    id: "mythic-overclocker",
    displayName: "신화 오버클러커",
    role: "support",
    attackStyle: "support",
    ingredients: [
      { grade: "epic", role: "support", count: 2 },
      { grade: "rare", role: "tank", count: 1 },
    ],
    description: "아군 공격 속도와 스킬 회전을 보조하는 지원형 신화 유닛입니다.",
  },
  {
    id: "mythic-treasure-hacker",
    displayName: "신화 보물해커",
    role: "support",
    attackStyle: "economy",
    ingredients: [
      { grade: "legendary", role: "support", count: 1 },
      { grade: "epic", role: "damage", count: 1 },
      { grade: "rare", role: "support", count: 1 },
    ],
    description: "코인과 행운석 운영을 돕는 경제형 고점 유닛입니다.",
  },
];
