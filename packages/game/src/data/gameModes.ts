export type GameModeDifficulty = "normal" | "hard" | "hell" | "divine" | "origin";
export type GameModeType = "single" | "coop" | "versus" | "challenge" | "infinite" | "daily" | "server-war";

export type GameModeDefinition = {
  id: string;
  displayName: string;
  type: GameModeType;
  difficulty?: GameModeDifficulty;
  maxWave?: number;
  energyCost?: number;
  description: string;
  unlockCondition: string;
  modifiers: string[];
};

export const gameModes: GameModeDefinition[] = [
  {
    id: "single-normal",
    displayName: "기본 방어",
    type: "single",
    difficulty: "normal",
    maxWave: 80,
    energyCost: 1,
    description: "가장 기본이 되는 싱글플레이 랜덤 디펜스 모드입니다.",
    unlockCondition: "처음부터 개방",
    modifiers: [],
  },
  {
    id: "single-hard",
    displayName: "어려움 방어",
    type: "single",
    difficulty: "hard",
    maxWave: 80,
    energyCost: 1,
    description: "특수 보스와 추가 목표가 등장하는 중급 난이도입니다.",
    unlockCondition: "기본 방어 클리어",
    modifiers: ["제어 효과 감소", "특수 보스 등장", "보스 체력 증가"],
  },
  {
    id: "single-hell",
    displayName: "지옥 방어",
    type: "single",
    difficulty: "hell",
    maxWave: 80,
    energyCost: 2,
    description: "강한 보스와 높은 체력의 적이 등장하는 고난이도 모드입니다.",
    unlockCondition: "어려움 방어 클리어",
    modifiers: ["몬스터 체력 증가", "제어 효과 크게 감소", "보스 특수 패턴"],
  },
  {
    id: "coop-defense",
    displayName: "2인 협동 방어",
    type: "coop",
    maxWave: 80,
    energyCost: 1,
    description: "두 플레이어가 함께 라인을 방어하는 협동 모드입니다.",
    unlockCondition: "MVP 이후 개방",
    modifiers: ["공동 라인", "협동 미션", "공유 보스"],
  },
  {
    id: "versus-race",
    displayName: "대전 레이스",
    type: "versus",
    maxWave: 60,
    energyCost: 1,
    description: "상대보다 오래 버티거나 더 빠르게 보스를 처치하는 경쟁 모드입니다.",
    unlockCondition: "랭킹 시스템 이후 개방",
    modifiers: ["상대 필드 비교", "스코어 경쟁"],
  },
  {
    id: "daily-dungeon",
    displayName: "오늘의 던전",
    type: "daily",
    maxWave: 40,
    energyCost: 1,
    description: "매일 규칙이 바뀌는 짧은 도전 모드입니다.",
    unlockCondition: "계정 저장 이후 개방",
    modifiers: ["일일 변형 규칙", "제한된 영웅 풀", "특수 보상"],
  },
  {
    id: "server-war",
    displayName: "서버전",
    type: "server-war",
    maxWave: 80,
    energyCost: 1,
    description: "디스코드 서버 구성원이 함께 점수를 쌓는 시즌 경쟁 모드입니다.",
    unlockCondition: "Discord OAuth 및 서버 연동 이후 개방",
    modifiers: ["서버 누적 점수", "시즌 랭킹", "커뮤니티 보상"],
  },
];
