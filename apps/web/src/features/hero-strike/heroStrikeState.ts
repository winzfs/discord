import { getNextXpRequirement } from "./heroStrikeBalance";
import { resetHeroStrikeCombatControl } from "./heroStrikeCombatControl";
import {
  HERO_STRIKE_HEIGHT,
  HERO_STRIKE_HIGH_SCORE_KEY,
  HERO_STRIKE_PLAYER_RADIUS,
  HERO_STRIKE_PLAYER_Y,
  HERO_STRIKE_WIDTH,
} from "./heroStrikeConfig";
import { applyHeroStrikeLoadout, readHeroStrikeLoadout, saveHeroStrikeLoadout } from "./heroStrikeLoadout";
import { getResearchBonuses, getResearchRank, readResearchData } from "./heroStrikeMetaProgress";
import { getStageObjective } from "./heroStrikeObjectives";
import type { HeroStrikeStar, HeroStrikeState } from "./heroStrikeTypes";

function readHighScore() {
  if (typeof window === "undefined") return 0;
  const value = Number(window.localStorage.getItem(HERO_STRIKE_HIGH_SCORE_KEY));
  return Number.isFinite(value) ? value : 0;
}

function createStars(): HeroStrikeStar[] {
  return Array.from({ length: 42 }, () => ({
    x: Math.random() * HERO_STRIKE_WIDTH,
    y: Math.random() * HERO_STRIKE_HEIGHT,
    speed: 22 + Math.random() * 86,
    size: 0.7 + Math.random() * 1.8,
    alpha: 0.18 + Math.random() * 0.65,
  }));
}

export function createInitialHeroStrikeState(): HeroStrikeState {
  const researchData = readResearchData();
  const researchRank = getResearchRank(researchData);
  const research = getResearchBonuses(researchRank);
  const objective = getStageObjective(0);

  return {
    phase: "title",
    previousPhase: "playing",
    loadout: readHeroStrikeLoadout(),
    elapsed: 0,
    stageElapsed: 0,
    score: 0,
    highScore: readHighScore(),
    kills: 0,
    maxCombo: 0,
    hitsTaken: 0,
    damageDealt: 0,
    blinksUsed: 0,
    flowActivations: 0,
    bossBreaks: 0,
    objectivesCompleted: 0,
    perfectStages: 0,
    upgradeRerolls: 1 + (researchRank >= 8 ? 1 : 0),
    rerollsUsed: 0,
    nextId: 1,
    player: {
      x: HERO_STRIKE_WIDTH / 2,
      y: HERO_STRIKE_PLAYER_Y,
      targetX: HERO_STRIKE_WIDTH / 2,
      targetY: HERO_STRIKE_PLAYER_Y,
      radius: HERO_STRIKE_PLAYER_RADIUS,
      hp: 4,
      maxHp: 4,
      shield: 1 + research.startingShield,
      invulnerable: 0,
      blinkCharges: 2,
      blinkMaxCharges: 2,
      blinkRecharge: 0,
      blinkRechargeDuration: 5.5,
      fireCooldown: 0,
      fireInterval: 0.18,
      damage: 24,
      bulletSpeed: 760,
      bulletCount: 1,
      spread: 0.12,
      pierce: 0,
      shotCounter: 0,
      flow: 0,
      flowMax: 100,
      flowRush: 0,
      flowDecayDelay: 0,
      magnetRadius: 180,
      campaignMagnetBonus: 0,
      ultimate: Math.min(100, 35 + research.startingUltimate),
      ultimateMax: 100,
      ultimateGainMultiplier: 1,
      level: 1,
      xp: 0,
      nextXp: getNextXpRequirement(1),
      xpGainMultiplier: research.xpMultiplier,
      scoreMultiplier: 1,
      campaignDamageMultiplier: research.damageMultiplier,
      campaignFireRateMultiplier: 1,
      bonusCriticalChance: 0,
      bonusCriticalMultiplier: 0,
      combo: 0,
      comboTimer: 0,
      overdrive: 0,
      overdriveLevel: 0,
      homingMissileLevel: 0,
      missileCooldown: 0,
      supportDroneLevel: 0,
      supportDroneCooldown: 0,
      sideCannonLevel: 0,
      rearGuardLevel: 0,
      explosiveRoundsLevel: 0,
      chainCoreLevel: 0,
      criticalChance: 0,
      criticalMultiplier: 1.75,
    },
    bullets: [],
    missiles: [],
    enemies: [],
    pickups: [],
    particles: [],
    texts: [],
    stars: createStars(),
    spawnCooldown: 0.25,
    formationCooldown: 7,
    formationIndex: 0,
    stageIndex: 0,
    stageBanner: 2.4,
    waveIndex: 1,
    waveBanner: 3.5,
    eliteSpawned: false,
    eliteDefeated: false,
    bossSpawned: false,
    bossDefeated: false,
    bossWarning: 0,
    bossPhaseBanner: 0,
    bossPhaseLabel: "",
    flowBanner: 0,
    bossBreakBanner: 0,
    hitStop: 0,
    shake: 0,
    flash: 0,
    stageKills: 0,
    stageHits: 0,
    stageGrazes: 0,
    stageMaxCombo: 0,
    objectiveId: objective.id,
    objectiveTarget: objective.target,
    objectiveComplete: false,
    objectiveRewarded: false,
    upgradeChoices: [],
    upgradeLevels: {},
    protocolChoices: [],
    protocolLevels: {},
    evolutions: [],
    evolutionBanner: 0,
    evolutionLabel: "",
    researchData,
    researchRank,
    runResearchEarned: 0,
    resultCommitted: false,
    pointerActive: false,
    pointerLastX: null,
    pointerLastY: null,
  };
}

export function openHeroStrikeLoadout(state: HeroStrikeState) {
  const selectedLoadout = { ...state.loadout };
  const fresh = createInitialHeroStrikeState();
  fresh.phase = "loadout";
  fresh.highScore = state.highScore;
  fresh.loadout = selectedLoadout;
  Object.assign(state, fresh);
  resetHeroStrikeCombatControl(state);
}

export function resetHeroStrikeState(state: HeroStrikeState) {
  const selectedLoadout = { ...state.loadout };
  saveHeroStrikeLoadout(selectedLoadout);
  const fresh = createInitialHeroStrikeState();
  fresh.phase = "playing";
  fresh.highScore = state.highScore;
  fresh.loadout = selectedLoadout;
  applyHeroStrikeLoadout(fresh);
  Object.assign(state, fresh);
  resetHeroStrikeCombatControl(state);
}
