import { getHeroStrikeSalvageBalance, spendHeroStrikeSalvage } from "./heroStrikeSalvage";
import { HERO_STRIKE_UPGRADE_MAX_LEVELS } from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState, UpgradeId } from "./heroStrikeTypes";

export type HeroStrikeArmoryOptionId = "repair" | "primary-tune" | "support-tune";

export type HeroStrikeArmoryOption = {
  id: HeroStrikeArmoryOptionId;
  title: string;
  icon: string;
  description: string;
  cost: number;
  available: boolean;
  unavailableReason: string | null;
};

type HeroStrikeArmoryRuntime = {
  stageIndex: number;
  purchaseMade: boolean;
  purchasedId: HeroStrikeArmoryOptionId | null;
};

const runtimeByState = new WeakMap<HeroStrikeState, HeroStrikeArmoryRuntime>();

function createRuntime(state: HeroStrikeState): HeroStrikeArmoryRuntime {
  return {
    stageIndex: state.stageIndex,
    purchaseMade: false,
    purchasedId: null,
  };
}

function getRuntime(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime || runtime.stageIndex !== state.stageIndex) {
    runtime = createRuntime(state);
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function resetHeroStrikeArmory(state: HeroStrikeState) {
  runtimeByState.set(state, createRuntime(state));
}

function selectedSupportUpgrade(state: HeroStrikeState): Extract<UpgradeId, "homing-missile" | "drone-wing" | "side-cannons"> {
  return state.loadout.support;
}

function selectedSupportLevel(state: HeroStrikeState) {
  if (state.loadout.support === "homing-missile") return state.player.homingMissileLevel;
  if (state.loadout.support === "drone-wing") return state.player.supportDroneLevel;
  return state.player.sideCannonLevel;
}

function selectedSupportMaxLevel(state: HeroStrikeState) {
  return HERO_STRIKE_UPGRADE_MAX_LEVELS[selectedSupportUpgrade(state)];
}

function primaryTuneTarget(state: HeroStrikeState): Extract<UpgradeId, "rapid-fire" | "twin-shot"> | null {
  const rapid = state.upgradeLevels["rapid-fire"] ?? 0;
  const twin = state.upgradeLevels["twin-shot"] ?? 0;
  const rapidMax = HERO_STRIKE_UPGRADE_MAX_LEVELS["rapid-fire"];
  const twinMax = HERO_STRIKE_UPGRADE_MAX_LEVELS["twin-shot"];
  if (rapid >= rapidMax && twin >= twinMax) return null;
  if (rapid >= rapidMax) return "twin-shot";
  if (twin >= twinMax) return "rapid-fire";
  return rapid / rapidMax <= twin / twinMax ? "rapid-fire" : "twin-shot";
}

function primaryTuneDescription(state: HeroStrikeState) {
  const target = primaryTuneTarget(state);
  if (!target) return "주무기 튜닝 완료";
  if (target === "rapid-fire") {
    if (state.loadout.primary === "rail-driver") return "축전 속도 단계 +1";
    if (state.loadout.primary === "scatter-array") return "펌프·재장전 단계 +1";
    return "점사·냉각 단계 +1";
  }
  if (state.loadout.primary === "rail-driver") return "충전포 보조 광선 단계 +1";
  if (state.loadout.primary === "scatter-array") return "산탄 펠릿 단계 +1";
  return "점사 탄 수 단계 +1";
}

export function getHeroStrikeArmoryOptions(state: HeroStrikeState): readonly HeroStrikeArmoryOption[] {
  const stageScale = Math.floor(state.stageIndex / 2) * 3;
  const canRepair = state.player.hp < state.player.maxHp;
  const canTunePrimary = primaryTuneTarget(state) !== null;
  const canTuneSupport = selectedSupportLevel(state) < selectedSupportMaxLevel(state);

  return [
    {
      id: "repair",
      title: "긴급 수리",
      icon: "♥",
      description: "체력을 2 회복합니다",
      cost: 24 + stageScale,
      available: canRepair,
      unavailableReason: canRepair ? null : "체력 최대",
    },
    {
      id: "primary-tune",
      title: "주무기 튜닝",
      icon: "✦",
      description: primaryTuneDescription(state),
      cost: 31 + stageScale,
      available: canTunePrimary,
      unavailableReason: canTunePrimary ? null : "주무기 튜닝 완료",
    },
    {
      id: "support-tune",
      title: "보조 튜닝",
      icon: "⌁",
      description: `선택 보조무기 레벨 +1 · 최대 ${selectedSupportMaxLevel(state)}`,
      cost: 34 + stageScale,
      available: canTuneSupport,
      unavailableReason: canTuneSupport ? null : "보조무기 최대",
    },
  ];
}

function tuneSelectedSupport(state: HeroStrikeState) {
  const player = state.player;
  const maxLevel = selectedSupportMaxLevel(state);
  if (state.loadout.support === "homing-missile") {
    player.homingMissileLevel = Math.min(maxLevel, player.homingMissileLevel + 1);
    state.upgradeLevels["homing-missile"] = player.homingMissileLevel;
    player.missileCooldown = 0;
  } else if (state.loadout.support === "drone-wing") {
    player.supportDroneLevel = Math.min(maxLevel, player.supportDroneLevel + 1);
    state.upgradeLevels["drone-wing"] = player.supportDroneLevel;
    player.supportDroneCooldown = 0;
  } else {
    player.sideCannonLevel = Math.min(maxLevel, player.sideCannonLevel + 1);
    state.upgradeLevels["side-cannons"] = player.sideCannonLevel;
  }
}

function tunePrimaryWeapon(state: HeroStrikeState) {
  const target = primaryTuneTarget(state);
  if (!target) return;
  const maxLevel = HERO_STRIKE_UPGRADE_MAX_LEVELS[target];
  state.upgradeLevels[target] = Math.min(maxLevel, (state.upgradeLevels[target] ?? 0) + 1);
}

function applyArmoryOption(state: HeroStrikeState, id: HeroStrikeArmoryOptionId) {
  if (id === "repair") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
  } else if (id === "primary-tune") {
    tunePrimaryWeapon(state);
  } else {
    tuneSelectedSupport(state);
  }
}

export function purchaseHeroStrikeArmoryOption(
  state: HeroStrikeState,
  id: HeroStrikeArmoryOptionId,
) {
  const runtime = getRuntime(state);
  if (runtime.purchaseMade) return false;
  const option = getHeroStrikeArmoryOptions(state).find((entry) => entry.id === id);
  if (!option || !option.available) return false;
  if (!spendHeroStrikeSalvage(state, option.cost)) return false;
  applyArmoryOption(state, id);
  runtime.purchaseMade = true;
  runtime.purchasedId = id;
  return true;
}

export function getHeroStrikeArmoryStatus(state: HeroStrikeState) {
  const runtime = getRuntime(state);
  return {
    purchaseMade: runtime.purchaseMade,
    purchasedId: runtime.purchasedId,
    salvage: getHeroStrikeSalvageBalance(state),
  };
}
