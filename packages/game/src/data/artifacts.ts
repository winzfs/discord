export type ArtifactCategory = "attack" | "economy" | "luck" | "summon" | "defense" | "control" | "gamble";

export type ArtifactDefinition = {
  id: string;
  displayName: string;
  category: ArtifactCategory;
  maxLevel: number;
  description: string;
  baseEffect: number;
  effectPerLevel: number;
};

export const artifacts: ArtifactDefinition[] = [
  {
    id: "power-tonic",
    displayName: "파워 토닉",
    category: "attack",
    maxLevel: 11,
    description: "전체 공격력이 증가합니다.",
    baseEffect: 0.05,
    effectPerLevel: 0.01,
  },
  {
    id: "arcane-manual",
    displayName: "전술 교본",
    category: "attack",
    maxLevel: 11,
    description: "마법형 피해가 증가합니다.",
    baseEffect: 0.05,
    effectPerLevel: 0.01,
  },
  {
    id: "vault-chip",
    displayName: "비밀 금고칩",
    category: "economy",
    maxLevel: 11,
    description: "웨이브 종료 시 보유 코인에 비례한 추가 코인을 획득합니다.",
    baseEffect: 0.02,
    effectPerLevel: 0.004,
  },
  {
    id: "coin-cannon",
    displayName: "코인 캐논",
    category: "economy",
    maxLevel: 11,
    description: "보유 코인에 비례해 전투력이 증가합니다.",
    baseEffect: 0.01,
    effectPerLevel: 0.002,
  },
  {
    id: "lucky-core",
    displayName: "행운 코어",
    category: "luck",
    maxLevel: 11,
    description: "미션 완료 시 추가 행운석을 얻을 확률이 증가합니다.",
    baseEffect: 0.1,
    effectPerLevel: 0.02,
  },
  {
    id: "summon-signal",
    displayName: "소환 신호기",
    category: "summon",
    maxLevel: 11,
    description: "일반 소환에서 희귀 이상 유닛 등장 확률이 증가합니다.",
    baseEffect: 0.02,
    effectPerLevel: 0.002,
  },
  {
    id: "roulette-gear",
    displayName: "룰렛 기어",
    category: "gamble",
    maxLevel: 11,
    description: "도박 소환 성공률이 증가합니다.",
    baseEffect: 0.03,
    effectPerLevel: 0.003,
  },
  {
    id: "refund-token",
    displayName: "환급 토큰",
    category: "gamble",
    maxLevel: 11,
    description: "도박 소환 실패 시 일정 확률로 비용 일부를 돌려받습니다.",
    baseEffect: 0.08,
    effectPerLevel: 0.01,
  },
  {
    id: "core-wall",
    displayName: "코어 장벽",
    category: "defense",
    maxLevel: 11,
    description: "코어 최대 HP와 누수 방어력이 증가합니다.",
    baseEffect: 0.05,
    effectPerLevel: 0.01,
  },
  {
    id: "slow-beacon",
    displayName: "감속 비콘",
    category: "control",
    maxLevel: 11,
    description: "둔화와 기절 계열 효과가 강화됩니다.",
    baseEffect: 0.05,
    effectPerLevel: 0.01,
  },
];

export function getArtifactById(artifactId: string): ArtifactDefinition | null {
  return artifacts.find((artifact) => artifact.id === artifactId) ?? null;
}
