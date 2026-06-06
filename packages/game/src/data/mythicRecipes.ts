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

const recipeA: MythicRecipeIngredient[] = [
  { grade: "common", count: 1 },
  { grade: "epic", count: 2 },
  { grade: "legendary", count: 1 },
];

const recipeB: MythicRecipeIngredient[] = [
  { grade: "common", count: 1 },
  { grade: "legendary", count: 2 },
];

const recipeC: MythicRecipeIngredient[] = [
  { grade: "common", count: 2 },
  { grade: "epic", count: 2 },
  { grade: "legendary", count: 1 },
];

export const mythicRecipes: MythicRecipeDefinition[] = [
  {
    id: "dva",
    displayName: "D.Va",
    role: "tank",
    attackStyle: "physical",
    ingredients: recipeA,
    description: "방어 매트릭스와 자폭으로 넓은 범위를 제압하는 폭발형 탱커입니다.",
  },
  {
    id: "zarya",
    displayName: "자리야",
    role: "tank",
    attackStyle: "control",
    ingredients: recipeC,
    description: "방벽으로 에너지를 충전하고 중력자탄으로 몬스터를 묶는 제어형 탱커입니다.",
  },
  {
    id: "winston",
    displayName: "윈스턴",
    role: "tank",
    attackStyle: "control",
    ingredients: recipeA,
    description: "테슬라 캐논과 점프 팩으로 다수의 적을 방해하는 연쇄 제어형 탱커입니다.",
  },
  {
    id: "tracer",
    displayName: "트레이서",
    role: "damage",
    attackStyle: "physical",
    ingredients: recipeA,
    description: "빠른 연사와 펄스 폭탄으로 전방의 적을 빠르게 녹이는 고속 딜러입니다.",
  },
  {
    id: "cassidy",
    displayName: "캐서디",
    role: "damage",
    attackStyle: "physical",
    ingredients: recipeB,
    description: "치명타와 황야의 무법자로 보스에게 큰 단일 피해를 주는 저격형 딜러입니다.",
  },
  {
    id: "genji",
    displayName: "겐지",
    role: "damage",
    attackStyle: "physical",
    ingredients: recipeC,
    description: "수리검과 용검으로 처치 연쇄를 노리는 기동형 딜러입니다.",
  },
  {
    id: "ana",
    displayName: "아나",
    role: "support",
    attackStyle: "support",
    ingredients: recipeA,
    description: "생체 소총과 나노 강화제로 적을 약화하고 아군 화력을 끌어올리는 지원가입니다.",
  },
  {
    id: "kiriko",
    displayName: "키리코",
    role: "support",
    attackStyle: "support",
    ingredients: recipeA,
    description: "쿠나이 치명타와 여우길로 주변 유닛의 공격 흐름을 가속하는 지원가입니다.",
  },
  {
    id: "illari",
    displayName: "일리아리",
    role: "support",
    attackStyle: "magic",
    ingredients: recipeB,
    description: "태양 소총과 태양 작렬로 표식 폭발을 만드는 공격형 지원가입니다.",
  },
];
