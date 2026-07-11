import { getStageObjectiveResearch, getStageObjectiveScore } from "./heroStrikeBalance";
import { HERO_STRIKE_COLORS, HERO_STRIKE_WIDTH } from "./heroStrikeConfig";
import { addFloatingText } from "./heroStrikeEffects";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import { grantResearchData } from "./heroStrikeMetaProgress";
import type { HeroStrikeEnemy, HeroStrikeState, StageObjectiveId } from "./heroStrikeTypes";

type ObjectiveDefinition = {
  id: StageObjectiveId;
  title: string;
  target: number;
};

export function getStageObjective(stageIndex: number): ObjectiveDefinition {
  const id = (["kills", "graze", "combo", "survivor", "elite"] as const)[stageIndex % 5];
  if (id === "kills") return { id, title: "적 격파", target: 24 + stageIndex * 4 };
  if (id === "graze") return { id, title: "그레이즈", target: 10 + stageIndex * 2 };
  if (id === "combo") return { id, title: "최대 콤보", target: 22 + stageIndex * 4 };
  if (id === "survivor") return { id, title: "허용 피격", target: stageIndex >= 8 ? 0 : 1 };
  return { id, title: "엘리트 격파", target: 1 };
}

export function resetStageObjective(state: HeroStrikeState, stageIndex: number) {
  const objective = getStageObjective(stageIndex);
  state.stageKills = 0;
  state.stageHits = 0;
  state.stageGrazes = 0;
  state.stageMaxCombo = 0;
  state.objectiveId = objective.id;
  state.objectiveTarget = objective.target;
  state.objectiveComplete = objective.id === "survivor";
  state.objectiveRewarded = false;
  state.eliteSpawned = false;
  state.eliteDefeated = false;
  state.waveIndex = 1;
  state.waveBanner = 3.5;
}

export function getObjectiveProgress(state: HeroStrikeState) {
  if (state.objectiveId === "kills") return state.stageKills;
  if (state.objectiveId === "graze") return state.stageGrazes;
  if (state.objectiveId === "combo") return state.stageMaxCombo;
  if (state.objectiveId === "elite") return state.eliteDefeated ? 1 : 0;
  return Math.max(0, state.objectiveTarget + 1 - state.stageHits);
}

export function isStageObjectiveComplete(state: HeroStrikeState) {
  if (state.objectiveId === "survivor") return state.stageHits <= state.objectiveTarget;
  return getObjectiveProgress(state) >= state.objectiveTarget;
}

function refreshObjectiveState(state: HeroStrikeState) {
  const wasComplete = state.objectiveComplete;
  state.objectiveComplete = isStageObjectiveComplete(state);
  if (!wasComplete && state.objectiveComplete) {
    addFloatingText(
      state,
      HERO_STRIKE_WIDTH / 2,
      205,
      "OBJECTIVE COMPLETE",
      HERO_STRIKE_COLORS.green,
      18,
    );
    state.flash = Math.max(state.flash, 0.16);
  }
}

export function recordStageEnemyDefeat(state: HeroStrikeState, enemy: HeroStrikeEnemy) {
  if (!enemy.boss) state.stageKills += 1;
  if (enemy.elite) state.eliteDefeated = true;
  state.stageMaxCombo = Math.max(state.stageMaxCombo, state.player.combo);
  state.maxCombo = Math.max(state.maxCombo, state.player.combo);
  refreshObjectiveState(state);
}

export function recordStageHit(state: HeroStrikeState) {
  state.stageHits += 1;
  refreshObjectiveState(state);
}

export function recordStageGraze(state: HeroStrikeState) {
  state.stageGrazes += 1;
  refreshObjectiveState(state);
}

export function getObjectiveStatusText(state: HeroStrikeState) {
  const definition = getStageObjective(state.stageIndex);
  if (state.objectiveId === "survivor") {
    return `${definition.title} ${state.stageHits}/${state.objectiveTarget}`;
  }
  return `${definition.title} ${Math.min(getObjectiveProgress(state), state.objectiveTarget)}/${state.objectiveTarget}`;
}

export function getObjectiveProgressRatio(state: HeroStrikeState) {
  if (state.objectiveId === "survivor") return state.stageHits <= state.objectiveTarget ? 1 : 0;
  return Math.max(0, Math.min(1, getObjectiveProgress(state) / Math.max(1, state.objectiveTarget)));
}

export function resolveStageObjective(state: HeroStrikeState) {
  refreshObjectiveState(state);
  if (!state.objectiveComplete || state.objectiveRewarded) return false;
  state.objectiveRewarded = true;
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  state.score += Math.round(getStageObjectiveScore(state.stageIndex) * difficulty.score);
  grantResearchData(state, getStageObjectiveResearch(state.stageIndex));
  state.player.shield = Math.min(5, state.player.shield + 1);
  return true;
}
