export type RunMissionReward = {
  resources?: number;
  luckStones?: number;
};

export type RunMissionDefinition = {
  id: string;
  displayName: string;
  description: string;
  target: number;
  reward: RunMissionReward;
  category: "summon" | "gamble" | "economy" | "combat" | "upgrade" | "collection";
};

export const runMissions: RunMissionDefinition[] = [
  {
    id: "discover-common-party",
    displayName: "일반 전력 확보",
    description: "일반 등급 유닛을 4명 이상 소환합니다.",
    target: 4,
    reward: { resources: 80 },
    category: "collection",
  },
  {
    id: "discover-rare-party",
    displayName: "희귀 전력 확보",
    description: "희귀 등급 유닛을 3명 이상 소환합니다.",
    target: 3,
    reward: { resources: 100 },
    category: "collection",
  },
  {
    id: "summon-epic-units",
    displayName: "영웅 등급 등장",
    description: "영웅 등급 유닛을 1명 이상 획득합니다.",
    target: 1,
    reward: { luckStones: 1 },
    category: "summon",
  },
  {
    id: "summon-legendary-unit",
    displayName: "전설 등급 등장",
    description: "전설 등급 유닛을 1명 이상 획득합니다.",
    target: 1,
    reward: { luckStones: 2 },
    category: "summon",
  },
  {
    id: "collect-resources-1000",
    displayName: "코인 수집",
    description: "한 판에서 코인을 누적 1000 이상 획득합니다.",
    target: 1000,
    reward: { resources: 120 },
    category: "economy",
  },
  {
    id: "collect-luck-stones",
    displayName: "행운석 수집",
    description: "한 판에서 행운석을 5개 이상 획득합니다.",
    target: 5,
    reward: { resources: 100 },
    category: "economy",
  },
  {
    id: "try-gamble-summon",
    displayName: "도박 소환 시도",
    description: "도박 소환을 10회 시도합니다.",
    target: 10,
    reward: { luckStones: 1 },
    category: "gamble",
  },
  {
    id: "upgrade-power-twice",
    displayName: "강화 2회",
    description: "공격력 강화를 2회 진행합니다.",
    target: 2,
    reward: { resources: 100 },
    category: "upgrade",
  },
  {
    id: "defeat-monsters-40",
    displayName: "몬스터 처치",
    description: "몬스터를 40마리 이상 처치합니다.",
    target: 40,
    reward: { resources: 100 },
    category: "combat",
  },
];
