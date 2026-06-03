import { getEnemyById } from "../data/enemies";
import { getHeroById } from "../data/heroes";
import { getWaveByNumber } from "../data/waves";
import type { GameState } from "../types/gameState";
import type { BoardHero, HeroDefinition } from "../types/hero";
import type { WaveDefinition } from "../types/wave";

export type BoardPowerBreakdown = {
  rawPower: number;
  attackSpeedBonus: number;
  rangeBonus: number;
  roleBonus: number;
  totalPower: number;
  heroCount: number;
};

export type WaveThreatBreakdown = {
  baseThreat: number;
  speedThreat: number;
  bossThreat: number;
  totalThreat: number;
};

export type LeakedEnemyGroup = {
  enemyId: string;
  count: number;
};

export type CombatResolution = {
  wave: WaveDefinition | null;
  boardPower: BoardPowerBreakdown;
  waveThreat: WaveThreatBreakdown;
  powerRatio: number;
  cleared: boolean;
  leakedEnemies: LeakedEnemyGroup[];
};

function getAttackTypeMultiplier(hero: HeroDefinition): number {
  switch (hero.attackType) {
    case "area":
      return 1.12;
    case "control":
      return 1.06;
    case "support":
      return 0.92;
    case "single":
    default:
      return 1;
  }
}

function getRoleBonus(heroes: HeroDefinition[]): number {
  const hasDamage = heroes.some((hero) => hero.role === "damage");
  const hasTank = heroes.some((hero) => hero.role === "tank");
  const hasSupport = heroes.some((hero) => hero.role === "support");

  if (hasDamage && hasTank && hasSupport) return 1.12;
  if ((hasDamage && hasTank) || (hasDamage && hasSupport) || (hasTank && hasSupport)) return 1.06;
  return 1;
}

function getHeroCombatPower(hero: HeroDefinition): number {
  const attackSpeedBonus = 0.82 + hero.attackSpeed * 0.18;
  const rangeBonus = 0.9 + Math.min(hero.range, 5) * 0.035;
  return hero.power * attackSpeedBonus * rangeBonus * getAttackTypeMultiplier(hero);
}

function getBoardHeroes(state: GameState): HeroDefinition[] {
  return state.board
    .filter((slot): slot is BoardHero => slot !== null)
    .map((slot) => getHeroById(slot.heroId))
    .filter((hero): hero is HeroDefinition => hero !== null);
}

export function calculateBoardPower(state: GameState): BoardPowerBreakdown {
  const boardHeroes = getBoardHeroes(state);
  const rawPower = boardHeroes.reduce((sum, hero) => sum + getHeroCombatPower(hero), 0);
  const averageAttackSpeed = boardHeroes.length > 0 ? boardHeroes.reduce((sum, hero) => sum + hero.attackSpeed, 0) / boardHeroes.length : 1;
  const averageRange = boardHeroes.length > 0 ? boardHeroes.reduce((sum, hero) => sum + hero.range, 0) / boardHeroes.length : 0;
  const attackSpeedBonus = 0.94 + Math.min(averageAttackSpeed, 1.5) * 0.06;
  const rangeBonus = 0.96 + Math.min(averageRange, 5) * 0.02;
  const roleBonus = getRoleBonus(boardHeroes);

  return {
    rawPower: Math.round(rawPower),
    attackSpeedBonus,
    rangeBonus,
    roleBonus,
    totalPower: Math.round(rawPower * attackSpeedBonus * rangeBonus * roleBonus),
    heroCount: boardHeroes.length,
  };
}

export function calculateWaveThreat(wave: WaveDefinition): WaveThreatBreakdown {
  const threat = wave.enemyGroups.reduce(
    (sum, group) => {
      const enemy = getEnemyById(group.enemyId);
      if (!enemy) return sum;

      const baseThreat = enemy.health * group.count;
      const speedThreat = baseThreat * Math.max(0, enemy.speed - 1) * 0.28;
      const bossThreat = enemy.type === "boss" ? baseThreat * 0.45 : 0;

      return {
        baseThreat: sum.baseThreat + baseThreat,
        speedThreat: sum.speedThreat + speedThreat,
        bossThreat: sum.bossThreat + bossThreat,
      };
    },
    { baseThreat: 0, speedThreat: 0, bossThreat: 0 },
  );

  return {
    baseThreat: Math.round(threat.baseThreat),
    speedThreat: Math.round(threat.speedThreat),
    bossThreat: Math.round(threat.bossThreat),
    totalThreat: Math.round(threat.baseThreat + threat.speedThreat + threat.bossThreat),
  };
}

function calculateLeakedEnemies(wave: WaveDefinition, powerRatio: number): LeakedEnemyGroup[] {
  if (powerRatio >= 1) return [];

  const leakRatio = Math.min(0.9, Math.max(0.08, 1 - powerRatio));
  const groups = [...wave.enemyGroups].reverse();

  return groups
    .map((group) => ({
      enemyId: group.enemyId,
      count: Math.min(group.count, Math.ceil(group.count * leakRatio)),
    }))
    .filter((group) => group.count > 0);
}

export function resolveWaveCombat(state: GameState, waveNumber = state.currentWave): CombatResolution {
  const wave = getWaveByNumber(waveNumber);
  const boardPower = calculateBoardPower(state);

  if (!wave) {
    return {
      wave: null,
      boardPower,
      waveThreat: { baseThreat: 0, speedThreat: 0, bossThreat: 0, totalThreat: 0 },
      powerRatio: 0,
      cleared: false,
      leakedEnemies: [],
    };
  }

  const waveThreat = calculateWaveThreat(wave);
  const powerRatio = waveThreat.totalThreat > 0 ? boardPower.totalPower / waveThreat.totalThreat : 1;
  const leakedEnemies = calculateLeakedEnemies(wave, powerRatio);

  return {
    wave,
    boardPower,
    waveThreat,
    powerRatio,
    cleared: leakedEnemies.length === 0,
    leakedEnemies,
  };
}

export function resolveCombatTick(state: GameState): GameState {
  // MVP 단계에서는 개별 투사체/타겟팅 대신 웨이브 단위 전투력 판정을 사용합니다.
  return state;
}
