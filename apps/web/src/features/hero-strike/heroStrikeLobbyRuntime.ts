import type { HeroStrikeLoadoutRow } from "./heroStrikeLoadoutLayout";
import type { HeroStrikeState } from "./heroStrikeTypes";

type HeroStrikeLobbyRuntime = {
  activeTab: HeroStrikeLoadoutRow;
};

const runtimeByState = new WeakMap<HeroStrikeState, HeroStrikeLobbyRuntime>();

function getRuntime(state: HeroStrikeState) {
  let runtime = runtimeByState.get(state);
  if (!runtime) {
    runtime = { activeTab: "primary" };
    runtimeByState.set(state, runtime);
  }
  return runtime;
}

export function getHeroStrikeLobbyTab(state: HeroStrikeState) {
  return getRuntime(state).activeTab;
}

export function setHeroStrikeLobbyTab(state: HeroStrikeState, activeTab: HeroStrikeLoadoutRow) {
  getRuntime(state).activeTab = activeTab;
}

export function resetHeroStrikeLobby(state: HeroStrikeState) {
  runtimeByState.set(state, { activeTab: "primary" });
}
