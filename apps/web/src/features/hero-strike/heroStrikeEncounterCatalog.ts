import type {
  HeroStrikeMissionDefinition,
  HeroStrikeMissionKind,
} from "./heroStrikeEncounterTypes";

const MISSION_ROTATIONS: readonly (readonly HeroStrikeMissionKind[])[] = [
  ["sweep", "intercept", "hold"],
  ["intercept", "hold", "sweep"],
  ["hold", "sweep", "intercept"],
];

function stageTarget(base: number, stageIndex: number, every: number) {
  return base + Math.floor(Math.max(0, stageIndex) / every);
}

function getMissionKind(stageIndex: number, waveIndex: number): HeroStrikeMissionKind {
  if (waveIndex >= 4) return "elite-duel";
  const rotation = MISSION_ROTATIONS[Math.max(0, stageIndex) % MISSION_ROTATIONS.length];
  return rotation[Math.max(0, Math.min(2, waveIndex - 1))];
}

function missionDefinition(kind: HeroStrikeMissionKind, stageIndex: number): HeroStrikeMissionDefinition {
  if (kind === "sweep") {
    return {
      kind,
      label: "SWEEP",
      title: "공세 정리",
      brief: "제한 시간 안에 적 편대를 빠르게 격파하세요",
      target: stageTarget(7, stageIndex, 2),
      rewardSalvage: 14 + stageIndex * 2,
      rewardScore: 900 + stageIndex * 180,
      accent: "#69e7ff",
    };
  }
  if (kind === "intercept") {
    return {
      kind,
      label: "INTERCEPT",
      title: "우선 표적 차단",
      brief: "금색 표적이 전장을 이탈하기 전에 격파하세요",
      target: 1,
      rewardSalvage: 20 + stageIndex * 2,
      rewardScore: 1250 + stageIndex * 220,
      accent: "#ffd166",
    };
  }
  if (kind === "hold") {
    return {
      kind,
      label: "HOLD",
      title: "작전 구역 유지",
      brief: "표시된 구역 안에서 탄막을 버티며 신호를 확보하세요",
      target: Math.min(9, 6.2 + stageIndex * 0.22),
      rewardSalvage: 22 + stageIndex * 3,
      rewardScore: 1450 + stageIndex * 240,
      accent: "#79f29d",
    };
  }
  return {
    kind,
    label: "ELITE DUEL",
    title: "지휘 개체 격파",
    brief: "엘리트를 먼저 끊어 최종 방어선을 무너뜨리세요",
    target: 1,
    rewardSalvage: 30 + stageIndex * 3,
    rewardScore: 1900 + stageIndex * 300,
    accent: "#bb86fc",
  };
}

export function getHeroStrikeMissionDefinition(
  stageIndex: number,
  waveIndex: number,
): HeroStrikeMissionDefinition {
  return missionDefinition(getMissionKind(stageIndex, waveIndex), stageIndex);
}
