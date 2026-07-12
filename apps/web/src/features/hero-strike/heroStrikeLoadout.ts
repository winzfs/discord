import {
  getMagnetRadius,
  getPulseDriveCharge,
  getUltimateGainMultiplier,
} from "./heroStrikeUpgradeScaling";
import type {
  HeroStrikeDifficulty,
  HeroStrikeLoadout,
  HeroStrikeState,
  PrimaryWeaponId,
  SupportLoadoutId,
  TacticalLoadoutId,
} from "./heroStrikeTypes";

const LOADOUT_STORAGE_KEY = "hero-strike-loadout-v1";

export const DEFAULT_HERO_STRIKE_LOADOUT: HeroStrikeLoadout = {
  primary: "pulse-blasters",
  support: "homing-missile",
  tactical: "shield-matrix",
  difficulty: "agent",
};

type LoadoutOption<T extends string> = {
  id: T;
  title: string;
  icon: string;
  description: string;
};

export const PRIMARY_WEAPON_OPTIONS: readonly LoadoutOption<PrimaryWeaponId>[] = [
  { id: "pulse-blasters", title: "펄스 리피터", icon: "✦", description: "양 모드 5점사 · FOCUS 정밀 락온" },
  { id: "scatter-array", title: "브리처", icon: "≋", description: "5발 탄창 · DRIVE 확산 · FOCUS 집탄" },
  { id: "rail-driver", title: "아크 레일", icon: "➤", description: "양 모드 지속 관통탄 · FOCUS 축전 방출" },
];

export const SUPPORT_LOADOUT_OPTIONS: readonly LoadoutOption<SupportLoadoutId>[] = [
  { id: "homing-missile", title: "미사일", icon: "◆", description: "FOCUS 표적 추적 폭발" },
  { id: "drone-wing", title: "드론", icon: "⌁", description: "락온 방향 양측 보조사격" },
  { id: "side-cannons", title: "측면포", icon: "⋘", description: "주무기 사이클 연동 보조탄" },
];

export const TACTICAL_LOADOUT_OPTIONS: readonly LoadoutOption<TacticalLoadoutId>[] = [
  { id: "shield-matrix", title: "방벽", icon: "⬡", description: "보호막 2칸 추가" },
  { id: "salvage-magnet", title: "자석", icon: "◎", description: "경험치 회수 범위 강화" },
  { id: "pulse-battery", title: "배터리", icon: "◉", description: "궁극기 획득 강화" },
];

export const DIFFICULTY_OPTIONS: readonly LoadoutOption<HeroStrikeDifficulty>[] = [
  { id: "recruit", title: "신병", icon: "Ⅰ", description: "적 약화 · 보상 85%" },
  { id: "agent", title: "요원", icon: "Ⅱ", description: "표준 패턴과 보상" },
  { id: "legend", title: "전설", icon: "Ⅲ", description: "빠른 압박 · 보상 증가" },
];

export type HeroStrikeDifficultyProfile = {
  enemyHealth: number;
  enemyBulletSpeed: number;
  spawnInterval: number;
  score: number;
  research: number;
};

const DIFFICULTY_PROFILES: Record<HeroStrikeDifficulty, HeroStrikeDifficultyProfile> = {
  recruit: { enemyHealth: 0.84, enemyBulletSpeed: 0.9, spawnInterval: 1.1, score: 0.85, research: 0.85 },
  agent: { enemyHealth: 1, enemyBulletSpeed: 1, spawnInterval: 1, score: 1, research: 1 },
  legend: { enemyHealth: 1.24, enemyBulletSpeed: 1.14, spawnInterval: 0.88, score: 1.35, research: 1.25 },
};

export function getDifficultyProfile(difficulty: HeroStrikeDifficulty) {
  return DIFFICULTY_PROFILES[difficulty];
}

export function getPrimaryWeaponProfile(primary: PrimaryWeaponId) {
  if (primary === "scatter-array") {
    return { damage: 32, fireInterval: 0.58, bulletSpeed: 680, bulletCount: 1, spread: 0.13, pierce: 0 };
  }
  if (primary === "rail-driver") {
    return { damage: 58, fireInterval: 0.8, bulletSpeed: 980, bulletCount: 1, spread: 0.04, pierce: 1 };
  }
  return { damage: 20, fireInterval: 0.34, bulletSpeed: 820, bulletCount: 1, spread: 0.08, pierce: 0 };
}

function isLoadout(value: unknown): value is HeroStrikeLoadout {
  if (!value || typeof value !== "object") return false;
  const loadout = value as Partial<HeroStrikeLoadout>;
  return PRIMARY_WEAPON_OPTIONS.some((option) => option.id === loadout.primary)
    && SUPPORT_LOADOUT_OPTIONS.some((option) => option.id === loadout.support)
    && TACTICAL_LOADOUT_OPTIONS.some((option) => option.id === loadout.tactical)
    && DIFFICULTY_OPTIONS.some((option) => option.id === loadout.difficulty);
}

export function readHeroStrikeLoadout(): HeroStrikeLoadout {
  if (typeof window === "undefined") return { ...DEFAULT_HERO_STRIKE_LOADOUT };
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(LOADOUT_STORAGE_KEY) ?? "null");
    return isLoadout(parsed) ? parsed : { ...DEFAULT_HERO_STRIKE_LOADOUT };
  } catch {
    return { ...DEFAULT_HERO_STRIKE_LOADOUT };
  }
}

export function saveHeroStrikeLoadout(loadout: HeroStrikeLoadout) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  }
}

export function applyHeroStrikeLoadout(state: HeroStrikeState) {
  const player = state.player;
  const primary = getPrimaryWeaponProfile(state.loadout.primary);
  player.damage = primary.damage;
  player.fireInterval = primary.fireInterval;
  player.bulletSpeed = primary.bulletSpeed;
  player.bulletCount = primary.bulletCount;
  player.spread = primary.spread;
  player.pierce = primary.pierce;

  if (state.loadout.support === "homing-missile") {
    state.upgradeLevels["homing-missile"] = 1;
    player.homingMissileLevel = 1;
  } else if (state.loadout.support === "drone-wing") {
    state.upgradeLevels["drone-wing"] = 1;
    player.supportDroneLevel = 1;
  } else {
    state.upgradeLevels["side-cannons"] = 1;
    player.sideCannonLevel = 1;
  }

  if (state.loadout.tactical === "shield-matrix") {
    state.upgradeLevels.shield = 1;
    player.shield = Math.min(5, player.shield + 2);
  } else if (state.loadout.tactical === "salvage-magnet") {
    state.upgradeLevels.magnet = 1;
    player.magnetRadius = getMagnetRadius(1);
  } else {
    state.upgradeLevels["pulse-drive"] = 1;
    player.ultimateGainMultiplier = getUltimateGainMultiplier(1);
    player.ultimate = Math.min(player.ultimateMax, player.ultimate + getPulseDriveCharge(1));
  }
}

export function getLoadoutSummary(loadout: HeroStrikeLoadout) {
  const primary = PRIMARY_WEAPON_OPTIONS.find((option) => option.id === loadout.primary)?.title ?? "펄스 리피터";
  const support = SUPPORT_LOADOUT_OPTIONS.find((option) => option.id === loadout.support)?.title ?? "미사일";
  const tactical = TACTICAL_LOADOUT_OPTIONS.find((option) => option.id === loadout.tactical)?.title ?? "방벽";
  const difficulty = DIFFICULTY_OPTIONS.find((option) => option.id === loadout.difficulty)?.title ?? "요원";
  return `${primary} · ${support} · ${tactical} · ${difficulty}`;
}
