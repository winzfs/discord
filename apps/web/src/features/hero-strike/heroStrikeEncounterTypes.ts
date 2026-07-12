export type HeroStrikeMissionKind =
  | "sweep"
  | "intercept"
  | "hold"
  | "elite-duel";

export type HeroStrikeMissionStatus =
  | "active"
  | "succeeded"
  | "failed";

export type HeroStrikeMissionDefinition = {
  kind: HeroStrikeMissionKind;
  label: string;
  title: string;
  brief: string;
  target: number;
  rewardSalvage: number;
  rewardScore: number;
  accent: string;
};

export type HeroStrikeMissionRuntime = {
  stageIndex: number;
  waveIndex: number;
  definition: HeroStrikeMissionDefinition;
  status: HeroStrikeMissionStatus;
  progress: number;
  startKills: number;
  startHits: number;
  targetEnemyId: number | null;
  lastTargetY: number;
  targetEnhanced: boolean;
  zoneX: number;
  zoneY: number;
  zoneRadius: number;
};

export type HeroStrikeOperationRuntime = {
  current: HeroStrikeMissionRuntime;
  salvage: number;
  missionsSucceeded: number;
  missionsFailed: number;
  perfectMissions: number;
};

export type HeroStrikeMissionSnapshot = {
  definition: HeroStrikeMissionDefinition;
  status: HeroStrikeMissionStatus;
  progress: number;
  ratio: number;
  targetEnemyId: number | null;
  zoneX: number;
  zoneY: number;
  zoneRadius: number;
  insideZone: boolean;
  salvage: number;
  missionsSucceeded: number;
  missionsFailed: number;
};
