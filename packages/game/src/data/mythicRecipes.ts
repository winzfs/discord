import type { HeroGrade, HeroRole } from "../types/hero";

export type MythicRecipeIngredient = {
  heroId?: string;
  grade?: HeroGrade;
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
      { heroId: "pulse-ranger", count: 2 },
      { heroId: "field-medic", count: 1 },
    ],
    description: "펄스 사수와 야전 의무병을 조합해 만드는 단일 보스 딜러입니다.",
  },
  {
    id: "mythic-storm-caller",
    displayName: "신화 폭풍술사",
    role: "damage",
    attackStyle: "magic",
    ingredients: [
      { heroId: "plasma-mage", count: 1 },
      { heroId: "field-medic", count: 1 },
      { heroId: "spark-runner", count: 1 },
    ],
    description: "플라즈마 마법과 지원 증폭을 합쳐 광역 마법 피해를 냅니다.",
  },
  {
    id: "mythic-shield-anchor",
    displayName: "신화 방벽대장",
    role: "tank",
    attackStyle: "control",
    ingredients: [
      { heroId: "barrier-guard", count: 2 },
      { heroId: "pulse-ranger", count: 1 },
    ],
    description: "방벽 수호자를 중심으로 라인을 늦추는 제어형 신화 유닛입니다.",
  },
  {
    id: "mythic-overclocker",
    displayName: "신화 오버클러커",
    role: "support",
    attackStyle: "support",
    ingredients: [
      { heroId: "overclock-tech", count: 2 },
      { heroId: "barrier-guard", count: 1 },
    ],
    description: "기술 지원 유닛을 조합해 아군 공격 속도와 스킬 회전을 보조합니다.",
  },
  {
    id: "mythic-treasure-hacker",
    displayName: "신화 보물해커",
    role: "support",
    attackStyle: "economy",
    ingredients: [
      { heroId: "credit-hacker", count: 1 },
      { heroId: "plasma-mage", count: 1 },
      { heroId: "field-medic", count: 1 },
    ],
    description: "해킹과 지원 기술로 코인과 행운석 운영을 돕는 경제형 고점 유닛입니다.",
  },
];
