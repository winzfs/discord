import {
  consumePendingHeroStrikeUpgrade,
  getPendingHeroStrikeUpgrades,
} from "./heroStrikeCombatControl";
import { getHeroStrikeUpgradeRole } from "./heroStrikeBuildCatalog";
import { draftHeroStrikeUpgradeChoices } from "./heroStrikeBuildDraft";
import { unlockEligibleEvolutions } from "./heroStrikeEvolutions";
import { getPrimaryWeaponProfile } from "./heroStrikeLoadout";
import {
  getArcRailProfile,
  getBreacherScatterProfile,
  getPulseRepeaterProfile,
} from "./heroStrikePrimaryWeaponProfiles";
import {
  describeUpgradeLevel,
  getCriticalChance,
  getCriticalMultiplier,
  getForwardBulletCount,
  getMagnetRadius,
  getPowerCoreDamage,
  getPulseDriveCharge,
  getRapidFireInterval,
  getShieldGrant,
  getUltimateGainMultiplier,
  HERO_STRIKE_UPGRADE_MAX_LEVELS,
} from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState, UpgradeId, UpgradeOption } from "./heroStrikeTypes";

type UpgradeMetadata = Omit<UpgradeOption, "description" | "currentLevel" | "nextLevel" | "maxLevel">;

const UPGRADE_POOL: UpgradeMetadata[] = [
  { id: "rapid-fire", title: "사이클 튜닝", icon: "⚡", rarity: "common" },
  { id: "twin-shot", title: "발사 구조 확장", icon: "✦", rarity: "rare" },
  { id: "power-core", title: "고출력 코어", icon: "◆", rarity: "common" },
  { id: "piercing", title: "관통 탄환", icon: "➤", rarity: "rare" },
  { id: "magnet", title: "회수 자석", icon: "◎", rarity: "common" },
  { id: "shield", title: "시간 방벽", icon: "⬡", rarity: "epic" },
  { id: "pulse-drive", title: "펄스 드라이브", icon: "◉", rarity: "rare" },
  { id: "overclock", title: "오버클럭", icon: "∞", rarity: "epic" },
  { id: "homing-missile", title: "유도 미사일", icon: "🚀", rarity: "epic" },
  { id: "drone-wing", title: "드론 편대", icon: "⌁", rarity: "epic" },
  { id: "side-cannons", title: "측면 포대", icon: "⋘", rarity: "rare" },
  { id: "explosive-rounds", title: "폭발 탄두", icon: "✹", rarity: "epic" },
  { id: "chain-core", title: "연쇄 코어", icon: "ϟ", rarity: "epic" },
  { id: "critical-core", title: "치명 코어", icon: "✧", rarity: "rare" },
];

const PRIMARY_SYNERGY: Record<HeroStrikeState["loadout"]["primary"], readonly UpgradeId[]> = {
  "pulse-blasters": ["rapid-fire", "twin-shot", "critical-core", "overclock"],
  "scatter-array": ["twin-shot", "explosive-rounds", "power-core", "rapid-fire"],
  "rail-driver": ["rapid-fire", "power-core", "piercing", "critical-core", "chain-core"],
};

const EVOLUTION_PARTNERS: Partial<Record<UpgradeId, UpgradeId>> = {
  "rapid-fire": "twin-shot",
  "twin-shot": "rapid-fire",
  "homing-missile": "explosive-rounds",
  "explosive-rounds": "homing-missile",
  "chain-core": "critical-core",
  "critical-core": "chain-core",
  "drone-wing": "shield",
  shield: "drone-wing",
};

function unlockedAtStage(id: UpgradeId) {
  if (id === "overclock" || id === "explosive-rounds") return 2;
  if (id === "chain-core") return 3;
  return 0;
}

function describeWeaponCycleUpgrade(state: HeroStrikeState) {
  if (state.loadout.primary === "scatter-array") {
    const profile = getBreacherScatterProfile(state);
    return `펌프 ${profile.pumpTime.toFixed(2)}초 · 재장전 ${profile.reloadTime.toFixed(2)}초`;
  }
  if (state.loadout.primary === "rail-driver") {
    const profile = getArcRailProfile(state);
    return `축전 속도 ${Math.round(profile.chargeRate * 100)}%/초`;
  }
  const profile = getPulseRepeaterProfile(state);
  return `점사 간격 ${profile.shotGap.toFixed(2)}초 · 냉각 ${Math.round(profile.driveCooling * 100)}%/초`;
}

function describeWeaponStructureUpgrade(state: HeroStrikeState) {
  if (state.loadout.primary === "scatter-array") {
    const profile = getBreacherScatterProfile(state);
    return `FOCUS ${profile.focusPellets}펠릿 · DRIVE ${profile.drivePellets}펠릿`;
  }
  if (state.loadout.primary === "rail-driver") {
    const profile = getArcRailProfile(state);
    return `주 광선 + 보조 광선 ${profile.sideBeams}쌍`;
  }
  const profile = getPulseRepeaterProfile(state);
  return `DRIVE ${profile.driveBurst}점사 · FOCUS ${profile.focusBurst}점사`;
}

function describeUpgradeForLoadout(state: HeroStrikeState, id: UpgradeId, level: number) {
  const primary = getPrimaryWeaponProfile(state.loadout.primary);
  if (id === "rapid-fire") {
    const previous = state.upgradeLevels[id] ?? 0;
    state.upgradeLevels[id] = level;
    const description = describeWeaponCycleUpgrade(state);
    state.upgradeLevels[id] = previous;
    return description;
  }
  if (id === "twin-shot") {
    const previous = state.upgradeLevels[id] ?? 0;
    state.upgradeLevels[id] = level;
    const description = describeWeaponStructureUpgrade(state);
    state.upgradeLevels[id] = previous;
    return description;
  }
  if (id === "power-core") return `기본 공격력 ${Math.round(getPowerCoreDamage(level, primary.damage))}`;
  if (id === "piercing") return `기본탄 관통 ${primary.pierce + level}회`;
  return describeUpgradeLevel(id, level);
}

function makeUpgradeOption(state: HeroStrikeState, metadata: UpgradeMetadata): UpgradeOption {
  const currentLevel = state.upgradeLevels[metadata.id] ?? 0;
  const nextLevel = currentLevel + 1;
  return {
    ...metadata,
    description: describeUpgradeForLoadout(state, metadata.id, nextLevel),
    currentLevel,
    nextLevel,
    maxLevel: HERO_STRIKE_UPGRADE_MAX_LEVELS[metadata.id],
  };
}

function upgradeWeight(state: HeroStrikeState, upgrade: UpgradeOption) {
  let weight = upgrade.rarity === "common" ? 6 : upgrade.rarity === "rare" ? 3.7 : 1.7;
  const currentLevel = state.upgradeLevels[upgrade.id] ?? 0;
  if (currentLevel > 0) weight += 1.7 + currentLevel * 0.45;
  if (PRIMARY_SYNERGY[state.loadout.primary].includes(upgrade.id)) weight += 2.2;
  if (upgrade.id === state.loadout.support && currentLevel < 2) weight += 2.8;
  const partner = EVOLUTION_PARTNERS[upgrade.id];
  if (state.stageIndex >= 4 && partner && (state.upgradeLevels[partner] ?? 0) > 0) weight += 2.4;
  if (state.player.hp <= 2 && upgrade.id === "shield") weight += 2.2;
  return weight;
}

function weightedPick(state: HeroStrikeState, pool: UpgradeOption[]) {
  const total = pool.reduce((sum, option) => sum + upgradeWeight(state, option), 0);
  let roll = Math.random() * total;
  for (const option of pool) {
    roll -= upgradeWeight(state, option);
    if (roll <= 0) return option;
  }
  return pool[pool.length - 1];
}

function replaceSystemsChoice(choices: UpgradeOption[], upgrade: UpgradeOption) {
  if (choices.some((choice) => choice.id === upgrade.id)) return choices;
  const systemsIndex = choices.findIndex((choice) => getHeroStrikeUpgradeRole(choice.id) === "systems");
  if (systemsIndex < 0) return choices;
  const next = [...choices];
  next[systemsIndex] = upgrade;
  return next;
}

export function createUpgradeChoices(state: HeroStrikeState, excludedIds: readonly UpgradeId[] = []) {
  const excluded = new Set(excludedIds);
  const allAvailable = UPGRADE_POOL
    .filter((upgrade) => state.stageIndex >= unlockedAtStage(upgrade.id))
    .filter((upgrade) => (state.upgradeLevels[upgrade.id] ?? 0) < HERO_STRIKE_UPGRADE_MAX_LEVELS[upgrade.id])
    .map((upgrade) => makeUpgradeOption(state, upgrade));
  const preferred = allAvailable.filter((upgrade) => !excluded.has(upgrade.id));
  const available = preferred.length >= 3 ? preferred : allAvailable;

  let choices = draftHeroStrikeUpgradeChoices(state, available, weightedPick, 3);
  const selectedSupport = allAvailable.find((upgrade) => upgrade.id === state.loadout.support);
  if (state.player.level <= 3 && selectedSupport && (state.upgradeLevels[state.loadout.support] ?? 0) === 1) {
    choices = replaceSystemsChoice(choices, selectedSupport);
  }
  return choices;
}

export function openQueuedHeroStrikeUpgrade(state: HeroStrikeState) {
  if (state.phase !== "playing" || getPendingHeroStrikeUpgrades(state) <= 0) return false;
  const choices = createUpgradeChoices(state);
  if (choices.length === 0) {
    consumePendingHeroStrikeUpgrade(state);
    return false;
  }
  consumePendingHeroStrikeUpgrade(state);
  state.upgradeChoices = choices;
  state.phase = "level-up";
  return true;
}

export function rerollUpgradeChoices(state: HeroStrikeState) {
  if (state.phase !== "level-up" || state.upgradeRerolls <= 0) return false;
  const previousIds = state.upgradeChoices.map((choice) => choice.id);
  const choices = createUpgradeChoices(state, previousIds);
  if (choices.length === 0) return false;
  state.upgradeChoices = choices;
  state.upgradeRerolls -= 1;
  state.rerollsUsed += 1;
  return true;
}

function finishLevelUp(state: HeroStrikeState) {
  state.upgradeChoices = [];
  state.phase = "playing";
}

export function applyUpgrade(state: HeroStrikeState, id: UpgradeId) {
  const player = state.player;
  const primary = getPrimaryWeaponProfile(state.loadout.primary);
  const nextLevel = (state.upgradeLevels[id] ?? 0) + 1;
  state.upgradeLevels[id] = nextLevel;

  switch (id) {
    case "rapid-fire": player.fireInterval = getRapidFireInterval(nextLevel, primary.fireInterval); break;
    case "twin-shot": player.bulletCount = getForwardBulletCount(nextLevel, primary.bulletCount); break;
    case "power-core": player.damage = getPowerCoreDamage(nextLevel, primary.damage); break;
    case "piercing": player.pierce = primary.pierce + nextLevel; break;
    case "magnet": player.magnetRadius = getMagnetRadius(nextLevel); break;
    case "shield":
      player.shield = Math.min(5, player.shield + getShieldGrant(nextLevel));
      player.invulnerable = Math.max(player.invulnerable, 0.4 + nextLevel * 0.12);
      break;
    case "pulse-drive":
      player.ultimateGainMultiplier = getUltimateGainMultiplier(nextLevel);
      player.ultimate = Math.min(player.ultimateMax, player.ultimate + getPulseDriveCharge(nextLevel));
      break;
    case "overclock": player.overdriveLevel = nextLevel; break;
    case "homing-missile":
      player.homingMissileLevel = nextLevel;
      player.missileCooldown = 0;
      break;
    case "drone-wing":
      player.supportDroneLevel = nextLevel;
      player.supportDroneCooldown = 0;
      break;
    case "side-cannons": player.sideCannonLevel = nextLevel; break;
    case "rear-guard": player.rearGuardLevel = nextLevel; break;
    case "explosive-rounds": player.explosiveRoundsLevel = nextLevel; break;
    case "chain-core": player.chainCoreLevel = nextLevel; break;
    case "critical-core":
      player.criticalChance = getCriticalChance(nextLevel);
      player.criticalMultiplier = getCriticalMultiplier(nextLevel);
      break;
  }

  unlockEligibleEvolutions(state);
  finishLevelUp(state);
}
