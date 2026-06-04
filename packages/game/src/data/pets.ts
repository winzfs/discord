export type PetGrade = "common" | "rare" | "epic" | "legendary" | "mythic" | "immortal";
export type PetCategory = "attack" | "physical" | "magic" | "luck" | "economy" | "defense" | "control";

export type PetDefinition = {
  id: string;
  displayName: string;
  grade: PetGrade;
  category: PetCategory;
  maxLevel: number;
  baseAttackBonus: number;
  attackBonusPerLevel: number;
  specialEffect: string;
};

export const pets: PetDefinition[] = [
  {
    id: "spark-pup",
    displayName: "스파크 퍼피",
    grade: "common",
    category: "attack",
    maxLevel: 50,
    baseAttackBonus: 0.01,
    attackBonusPerLevel: 0.001,
    specialEffect: "기본 공격 피해가 소폭 증가합니다.",
  },
  {
    id: "mini-bot",
    displayName: "미니봇",
    grade: "rare",
    category: "physical",
    maxLevel: 50,
    baseAttackBonus: 0.02,
    attackBonusPerLevel: 0.0015,
    specialEffect: "물리형 유닛의 피해가 증가합니다.",
  },
  {
    id: "mana-cat",
    displayName: "마나캣",
    grade: "epic",
    category: "magic",
    maxLevel: 50,
    baseAttackBonus: 0.03,
    attackBonusPerLevel: 0.002,
    specialEffect: "마법형 유닛의 스킬 회전이 빨라집니다.",
  },
  {
    id: "lucky-otter",
    displayName: "럭키수달",
    grade: "legendary",
    category: "luck",
    maxLevel: 50,
    baseAttackBonus: 0.04,
    attackBonusPerLevel: 0.0025,
    specialEffect: "웨이브 완료 시 낮은 확률로 행운석을 추가 획득합니다.",
  },
  {
    id: "gold-whale",
    displayName: "골드고래",
    grade: "mythic",
    category: "economy",
    maxLevel: 50,
    baseAttackBonus: 0.05,
    attackBonusPerLevel: 0.003,
    specialEffect: "코인 보상이 증가합니다.",
  },
  {
    id: "core-turtle",
    displayName: "코어거북",
    grade: "immortal",
    category: "defense",
    maxLevel: 50,
    baseAttackBonus: 0.06,
    attackBonusPerLevel: 0.0035,
    specialEffect: "코어 HP와 누수 방어력이 증가합니다.",
  },
];

export const petSlotRules = [
  { totalPetLevel: 0, slotCount: 1 },
  { totalPetLevel: 100, slotCount: 2 },
  { totalPetLevel: 200, slotCount: 3 },
] as const;

export function getPetById(petId: string): PetDefinition | null {
  return pets.find((pet) => pet.id === petId) ?? null;
}
