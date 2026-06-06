import type { HeroGrade } from "@discord-random-defense/game";
import type { LobbyHero } from "./lobbyData";

export type RecruitPullMode = "single" | "ten";

export type RecruitResult = {
  heroId: string;
  displayName: string;
  grade: HeroGrade;
  shards: number;
  wasNew: boolean;
};

export type RecruitSummary = {
  results: RecruitResult[];
  nextHeroes: LobbyHero[];
  totalShards: number;
  newHeroCount: number;
};

type GradeRate = {
  grade: HeroGrade;
  weight: number;
};

export const recruitCosts = {
  singleCrystal: 300,
  tenCrystal: 2700,
  singleTicket: 1,
  tenTicket: 10,
} as const;

export const recruitGradeRates: GradeRate[] = [
  { grade: "common", weight: 54 },
  { grade: "rare", weight: 28 },
  { grade: "epic", weight: 13 },
  { grade: "legendary", weight: 4.2 },
  { grade: "mythic", weight: 0.8 },
];

const gradeShardRewards: Record<HeroGrade, number> = {
  common: 3,
  rare: 5,
  epic: 8,
  legendary: 14,
  mythic: 22,
};

const tenPullBonusShardByGrade: Partial<Record<HeroGrade, number>> = {
  epic: 2,
  legendary: 3,
  mythic: 5,
};

function pickWeightedGrade(random: () => number, rates: GradeRate[]) {
  const total = rates.reduce((sum, rate) => sum + rate.weight, 0);
  let roll = random() * total;
  for (const rate of rates) {
    roll -= rate.weight;
    if (roll <= 0) return rate.grade;
  }
  return rates[rates.length - 1]?.grade ?? "common";
}

function pickHeroByGrade(random: () => number, heroes: LobbyHero[], grade: HeroGrade) {
  const candidates = heroes.filter((hero) => hero.grade === grade);
  if (candidates.length === 0) return heroes[Math.floor(random() * heroes.length)] ?? heroes[0];
  return candidates[Math.floor(random() * candidates.length)] ?? candidates[0];
}

function applyRecruitResult(heroes: LobbyHero[], picked: LobbyHero, shards: number): { heroes: LobbyHero[]; wasNew: boolean } {
  let wasNew = false;
  const nextHeroes = heroes.map((hero) => {
    if (hero.id !== picked.id) return hero;
    wasNew = !hero.owned;
    return {
      ...hero,
      owned: true,
      level: hero.owned ? Math.max(1, hero.level) : 1,
      shards: hero.shards + shards,
    };
  });
  return { heroes: nextHeroes, wasNew };
}

export function recruitHeroes(heroes: LobbyHero[], mode: RecruitPullMode, random: () => number = Math.random): RecruitSummary {
  const pullCount = mode === "ten" ? 10 : 1;
  let nextHeroes = heroes.map((hero) => ({ ...hero }));
  const results: RecruitResult[] = [];

  for (let index = 0; index < pullCount; index += 1) {
    const rates = mode === "ten" && index === pullCount - 1
      ? recruitGradeRates.map((rate) => rate.grade === "common" ? { ...rate, weight: 0 } : rate)
      : recruitGradeRates;
    const grade = pickWeightedGrade(random, rates);
    const picked = pickHeroByGrade(random, nextHeroes, grade);
    const bonus = mode === "ten" ? tenPullBonusShardByGrade[grade] ?? 0 : 0;
    const shards = gradeShardRewards[grade] + bonus;
    const applied = applyRecruitResult(nextHeroes, picked, shards);
    nextHeroes = applied.heroes;
    results.push({
      heroId: picked.id,
      displayName: picked.displayName,
      grade: picked.grade,
      shards,
      wasNew: applied.wasNew,
    });
  }

  return {
    results,
    nextHeroes,
    totalShards: results.reduce((sum, result) => sum + result.shards, 0),
    newHeroCount: results.filter((result) => result.wasNew).length,
  };
}

export function formatRecruitRateText() {
  return recruitGradeRates
    .map((rate) => `${rate.grade} ${rate.weight}%`)
    .join(" · ");
}
