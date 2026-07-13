import {
  getHeroStrikeBlueprintCount,
  getHeroStrikeBlueprintRank,
  getNextHeroStrikeBlueprint,
  getUnlockedHeroStrikeBlueprintCount,
  isHeroStrikeBlueprintUnlocked,
} from "./heroStrikeBlueprints";
import {
  DIFFICULTY_OPTIONS,
  getDifficultyProfile,
  PRIMARY_WEAPON_OPTIONS,
  SUPPORT_LOADOUT_OPTIONS,
  TACTICAL_LOADOUT_OPTIONS,
} from "./heroStrikeLoadout";
import type { HeroStrikeLoadoutRow } from "./heroStrikeLoadoutLayout";
import { getResearchProgress } from "./heroStrikeMetaProgress";
import {
  getArcRailProfile,
  getBreacherScatterProfile,
  getPulseRepeaterProfile,
} from "./heroStrikePrimaryWeaponProfiles";
import {
  getHeroStrikeOperationEstimatedMinutes,
  getHeroStrikeStage,
  HERO_STRIKE_STAGES,
} from "./heroStrikeStages";
import {
  getMagnetRadius,
  getPulseDriveCharge,
  getUltimateGainMultiplier,
} from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState } from "./heroStrikeTypes";

type BasicLoadoutOption = {
  id: string;
  title: string;
  icon: string;
  description: string;
};

export type HeroStrikeLobbyOption = BasicLoadoutOption & {
  metric: string;
  detail: string;
  unlocked: boolean;
  unlockRank: number;
  selected: boolean;
};

export type HeroStrikeLobbyCategory = {
  id: HeroStrikeLoadoutRow;
  label: string;
  shortLabel: string;
  subtitle: string;
  accent: string;
  selectedId: string;
  options: readonly HeroStrikeLobbyOption[];
};

const CATEGORY_META: Record<HeroStrikeLoadoutRow, Omit<HeroStrikeLobbyCategory, "id" | "selectedId" | "options">> = {
  primary: {
    label: "PRIMARY ARMAMENT",
    shortLabel: "PRIMARY",
    subtitle: "DRIVE와 FOCUS의 전투 리듬을 결정하는 주무기",
    accent: "#ff9b3d",
  },
  support: {
    label: "SUPPORT SYSTEM",
    shortLabel: "SUPPORT",
    subtitle: "주무기의 사각을 메우는 자동 화력",
    accent: "#b8ff5a",
  },
  tactical: {
    label: "TACTICAL GEAR",
    shortLabel: "TACTICAL",
    subtitle: "생존과 자원 운영을 결정하는 장비",
    accent: "#69e7ff",
  },
  difficulty: {
    label: "OPERATION RISK",
    shortLabel: "RISK",
    subtitle: "적 압박과 작전 보상 배율",
    accent: "#bb86fc",
  },
};

function optionsFor(row: HeroStrikeLoadoutRow): readonly BasicLoadoutOption[] {
  if (row === "primary") return PRIMARY_WEAPON_OPTIONS;
  if (row === "support") return SUPPORT_LOADOUT_OPTIONS;
  if (row === "tactical") return TACTICAL_LOADOUT_OPTIONS;
  return DIFFICULTY_OPTIONS;
}

function selectedIdFor(state: HeroStrikeState, row: HeroStrikeLoadoutRow) {
  if (row === "primary") return state.loadout.primary;
  if (row === "support") return state.loadout.support;
  if (row === "tactical") return state.loadout.tactical;
  return state.loadout.difficulty;
}

function primaryMetric(state: HeroStrikeState, id: string) {
  if (id === "scatter-array") {
    const profile = getBreacherScatterProfile(state);
    return {
      metric: `${profile.magazine} SHELL · ${profile.drivePellets}/${profile.focusPellets} PELLET`,
      detail: `DRIVE ${profile.drivePumpTime.toFixed(2)}s · FOCUS ${profile.focusPumpTime.toFixed(2)}s`,
    };
  }
  if (id === "rail-driver") {
    const profile = getArcRailProfile(state);
    return {
      metric: "MOVE TO CHARGE",
      detail: `축전 ${Math.round(profile.chargeRate * 100)}%/s · FOCUS 1회 방출`,
    };
  }
  const profile = getPulseRepeaterProfile(state);
  return {
    metric: `${profile.driveBurst}/${profile.focusBurst} BURST`,
    detail: `DRIVE 냉각 ${Math.round(profile.driveCooling * 100)} · FOCUS ${Math.round(profile.focusCooling * 100)}%/s`,
  };
}

function metricFor(state: HeroStrikeState, row: HeroStrikeLoadoutRow, id: string) {
  if (row === "primary") return primaryMetric(state, id);
  if (row === "support") {
    if (id === "homing-missile") return { metric: "LOCK-ON", detail: "추적 · 범위 폭발" };
    if (id === "drone-wing") return { metric: "TWIN WING", detail: "양측 · 자동 사격" };
    return { metric: "CYCLE LINK", detail: "주무기 사이클 연동" };
  }
  if (row === "tactical") {
    if (id === "shield-matrix") return { metric: "SHIELD +2", detail: "출격 보호막 추가" };
    if (id === "salvage-magnet") return { metric: `RANGE ${getMagnetRadius(1)}`, detail: "XP 회수 반경 강화" };
    return {
      metric: `ULT +${getPulseDriveCharge(1)}`,
      detail: `획득량 ${Math.round(getUltimateGainMultiplier(1) * 100)}%`,
    };
  }
  const profile = getDifficultyProfile(id as HeroStrikeState["loadout"]["difficulty"]);
  return {
    metric: `REWARD ${Math.round(profile.score * 100)}%`,
    detail: `HP ${Math.round(profile.enemyHealth * 100)} · BULLET ${Math.round(profile.enemyBulletSpeed * 100)}`,
  };
}

export function getHeroStrikeLobbyCategory(
  state: HeroStrikeState,
  row: HeroStrikeLoadoutRow,
): HeroStrikeLobbyCategory {
  const selectedId = selectedIdFor(state, row);
  const meta = CATEGORY_META[row];
  return {
    id: row,
    ...meta,
    selectedId,
    options: optionsFor(row).map((option) => {
      const metric = metricFor(state, row, option.id);
      return {
        ...option,
        ...metric,
        unlocked: isHeroStrikeBlueprintUnlocked(state.researchRank, row, option.id),
        unlockRank: getHeroStrikeBlueprintRank(row, option.id),
        selected: option.id === selectedId,
      };
    }),
  };
}

function selectedOption(state: HeroStrikeState, row: HeroStrikeLoadoutRow) {
  return getHeroStrikeLobbyCategory(state, row).options.find((option) => option.selected)
    ?? getHeroStrikeLobbyCategory(state, row).options[0];
}

export function getHeroStrikeLobbySnapshot(state: HeroStrikeState) {
  const firstStage = getHeroStrikeStage(0);
  const finalStage = getHeroStrikeStage(HERO_STRIKE_STAGES.length - 1);
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const research = getResearchProgress(state.researchData);
  const nextBlueprint = getNextHeroStrikeBlueprint(research.rank);
  const threat = state.loadout.difficulty === "legend"
    ? { label: "EXTREME", bars: 5 }
    : state.loadout.difficulty === "recruit"
      ? { label: "LOW", bars: 2 }
      : { label: "STANDARD", bars: 3 };

  return {
    hero: {
      name: "TRACER",
      role: "STRIKE PILOT",
      passive: "DRIVE 이동 · FOCUS 무기 강공격",
      tactical: "BLINK ×2",
      ultimate: "PULSE OVERLOAD",
    },
    mission: {
      operationCode: "OP-05",
      name: "OMEGA STRIKE",
      subtitle: `${firstStage.name} → ${finalStage.name}`,
      bossName: finalStage.bossName,
      encounters: HERO_STRIKE_STAGES.length * 4,
      estimatedMinutes: getHeroStrikeOperationEstimatedMinutes(),
      threatLabel: threat.label,
      threatBars: threat.bars,
      scoreMultiplier: difficulty.score,
      researchMultiplier: difficulty.research,
    },
    slots: (["primary", "support", "tactical", "difficulty"] as const).map((row) => ({
      row,
      label: CATEGORY_META[row].shortLabel,
      option: selectedOption(state, row),
      accent: CATEGORY_META[row].accent,
    })),
    blueprint: {
      rank: research.rank,
      ratio: research.ratio,
      data: state.researchData,
      nextData: research.next,
      nextTitle: nextBlueprint?.title ?? "ALL BLUEPRINTS UNLOCKED",
      nextRank: nextBlueprint?.rank ?? research.rank,
      unlocked: getUnlockedHeroStrikeBlueprintCount(research.rank),
      total: getHeroStrikeBlueprintCount(),
    },
  };
}
