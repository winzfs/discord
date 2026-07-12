import { getHeroStrikeSalvageBalance, spendHeroStrikeSalvage } from "./heroStrikeSalvage";
import type { HeroStrikeState } from "./heroStrikeTypes";

export type HeroStrikeArmoryOptionId = "repair" | "support-tune" | "tactical-charge";

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

function selectedSupportLevel(state: HeroStrikeState) {
  if (state.loadout.support === "homing-missile") return state.player.homingMissileLevel;
  if (state.loadout.support === "drone-wing") return state.player.supportDroneLevel;
  return state.player.sideCannonLevel;
}

export function getHeroStrikeArmoryOptions(state: HeroStrikeState): readonly HeroStrikeArmoryOption[] {
  const stageScale = Math.floor(state.stageIndex / 2) * 3;
  const canRepair = state.player.hp < state.player.maxHp;
  const canTuneSupport = selectedSupportLevel(state) < 4;
  const canChargeTactical = state.player.shield < 5
    || state.player.ultimate < state.player.ultimateMax;

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
      id: "support-tune",
      title: "보조 튜닝",
      icon: "⌁",
      description: "선택 보조무기 레벨 +1",
      cost: 34 + stageScale,
      available: canTuneSupport,
      unavailableReason: canTuneSupport ? null : "보조무기 최대",
    },
    {
      id: "tactical-charge",
      title: "전술 충전",
      icon: "◉",
      description: "보호막 +1 · 궁극기 +35%",
      cost: 27 + stageScale,
      available: canChargeTactical,
      unavailableReason: canChargeTactical ? null : "전술 자원 최대",
    },
  ];
}

function tuneSelectedSupport(state: HeroStrikeState) {
  const player = state.player;
  if (state.loadout.support === "homing-missile") {
    player.homingMissileLevel = Math.min(4, player.homingMissileLevel + 1);
    state.upgradeLevels["homing-missile"] = player.homingMissileLevel;
    player.missileCooldown = 0;
  } else if (state.loadout.support === "drone-wing") {
    player.supportDroneLevel = Math.min(4, player.supportDroneLevel + 1);
    state.upgradeLevels["drone-wing"] = player.supportDroneLevel;
    player.supportDroneCooldown = 0;
  } else {
    player.sideCannonLevel = Math.min(4, player.sideCannonLevel + 1);
    state.upgradeLevels["side-cannons"] = player.sideCannonLevel;
  }
}

function applyArmoryOption(state: HeroStrikeState, id: HeroStrikeArmoryOptionId) {
  if (id === "repair") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
  } else if (id === "support-tune") {
    tuneSelectedSupport(state);
  } else {
    state.player.shield = Math.min(5, state.player.shield + 1);
    state.player.ultimate = Math.min(
      state.player.ultimateMax,
      state.player.ultimate + state.player.ultimateMax * 0.35,
    );
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
