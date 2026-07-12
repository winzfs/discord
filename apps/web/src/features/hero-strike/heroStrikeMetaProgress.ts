import { getRunResearchReward } from "./heroStrikeBalance";
import { getDifficultyProfile } from "./heroStrikeLoadout";
import type { HeroStrikeState } from "./heroStrikeTypes";

const HERO_STRIKE_RESEARCH_KEY = "hero-strike-research-v1";
const RESEARCH_THRESHOLDS = [
  0, 60, 150, 280, 450, 680, 960, 1300, 1700, 2160,
  2700, 3320, 4020, 4800, 5660, 6600, 7620, 8720, 9900, 11160,
] as const;

export function readResearchData() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(HERO_STRIKE_RESEARCH_KEY));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function getResearchRank(data: number) {
  let rank = 1;
  for (let index = 1; index < RESEARCH_THRESHOLDS.length; index += 1) {
    if (data >= RESEARCH_THRESHOLDS[index]) rank = index + 1;
    else break;
  }
  return rank;
}

export function getResearchBonuses(rank: number) {
  return {
    damageMultiplier: 1,
    xpMultiplier: 1,
    startingUltimate: rank >= 8 ? 15 : rank >= 4 ? 8 : 0,
    startingShield: rank >= 12 ? 1 : 0,
  };
}

export function getResearchProgress(data: number) {
  const rank = getResearchRank(data);
  const currentIndex = Math.max(0, rank - 1);
  const current = RESEARCH_THRESHOLDS[currentIndex] ?? RESEARCH_THRESHOLDS[RESEARCH_THRESHOLDS.length - 1];
  const next = RESEARCH_THRESHOLDS[currentIndex + 1] ?? current;
  const ratio = next <= current ? 1 : Math.max(0, Math.min(1, (data - current) / (next - current)));
  return { rank, current, next, ratio };
}

export function grantResearchData(state: HeroStrikeState, amount: number) {
  const difficulty = getDifficultyProfile(state.loadout.difficulty);
  const granted = Math.max(0, Math.floor(amount * difficulty.research));
  if (granted <= 0) return 0;
  state.researchData += granted;
  state.runResearchEarned += granted;
  state.researchRank = getResearchRank(state.researchData);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(HERO_STRIKE_RESEARCH_KEY, String(state.researchData));
  }
  return granted;
}

export function finalizeHeroStrikeRun(state: HeroStrikeState) {
  if (state.resultCommitted) return;
  state.resultCommitted = true;
  grantResearchData(state, getRunResearchReward(state));
}
