import { getNextXpRequirement } from "./heroStrikeBalance";
import { unlockEligibleEvolutions } from "./heroStrikeEvolutions";
import { getPrimaryWeaponProfile } from "./heroStrikeLoadout";
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
  HERO_STRIKE_WEAPON_UPGRADES,
} from "./heroStrikeUpgradeScaling";
import type { HeroStrikeState, UpgradeId, UpgradeOption } from "./heroStrikeTypes";

type UpgradeMetadata = Omit<UpgradeOption, "description" | "currentLevel" | "nextLevel" | "maxLevel">;

const UPGRADE_POOL: UpgradeMetadata[] = [
  { id: "rapid-fire", title: "속사 모듈", icon: "⚡", rarity: "common" },
  { id: "twin-shot", title: "펄스 확장", icon: "✦", rarity: "rare" },
  { id: "power-core", title: "고출력 코어", icon: "◆", rarity: "common" },
  { id: "piercing", title: "관통 탄환", icon: "➤", rarity: "rare" },
  { id: "magnet", title: "회수 자석", icon: "◎", rarity: "common" },
  { id: "shield", title: "시간 방벽", icon: "⬡", rarity: "epic" },
  { id: "pulse-drive", title: "펄스 드라이브", icon: "◉", rarity: "rare" },
  { id: "overclock", title: "오버클럭", icon: "∞", rarity: "epic" },
  { id: "homing-missile", title: "유도 미사일", icon: "🚀", rarity: "epic" },
  { id: "drone-wing", title: "드론 편대", icon: "⌁", rarity: "epic" },
  { id: "side-cannons", title: "측면 포대", icon: "⋘", rarity: "rare" },
  { id: "rear-guard", title: "후방 방어포", icon: "⇊", rarity: "rare" },
  { id: "explosive-rounds", title: "폭발 탄두", icon: "✹", rarity: "epic" },
  { id: "chain-core", title: "연쇄 코어", icon: "ϟ", rarity: "epic" },
  { id: "critical-core", title: "치명 코어", icon: "✧", rarity: "rare" },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function describeUpgradeForLoadout(state: HeroStrikeState, id: UpgradeId, level: number) {
  const primary = getPrimaryWeaponProfile(state.loadout.primary);
  if (id === "rapid-fire") return `공격 간격 ${getRapidFireInterval(level, primary.fireInterval).toFixed(2)}초`;
  if (id === "twin-shot") return `정면 탄환 ${getForwardBulletCount(level, primary.bulletCount)}발`;
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

function replaceLastChoice(choices: UpgradeOption[], upgrade: UpgradeOption) {
  const withoutDuplicate = choices.filter((choice) => choice.id !== upgrade.id);
  return [...withoutDuplicate.slice(0, 2), upgrade];
}

export function createUpgradeChoices(state: HeroStrikeState) {
  const available = UPGRADE_POOL
    .filter((upgrade) => (state.upgradeLevels[upgrade.id] ?? 0) < HERO_STRIKE_UPGRADE_MAX_LEVELS[upgrade.id])
    .map((upgrade) => makeUpgradeOption(state, upgrade));

  let choices = shuffle(available).slice(0, 3);
  const selectedSupport = available.find((upgrade) => upgrade.id === state.loadout.support);
  if (state.player.level <= 2 && selectedSupport && (state.upgradeLevels[state.loadout.support] ?? 0) === 1) {
    choices = replaceLastChoice(choices, selectedSupport);
  } else if (!choices.some((choice) => HERO_STRIKE_WEAPON_UPGRADES.has(choice.id))) {
    const weapon = shuffle(available.filter((upgrade) => HERO_STRIKE_WEAPON_UPGRADES.has(upgrade.id)))[0];
    if (weapon) choices = replaceLastChoice(choices, weapon);
  }
  return choices;
}

function continuePendingLevelUps(state: HeroStrikeState) {
  const player = state.player;
  if (player.xp < player.nextXp) {
    state.upgradeChoices = [];
    state.phase = "playing";
    return;
  }

  player.xp -= player.nextXp;
  player.level += 1;
  player.nextXp = getNextXpRequirement(player.level);
  const choices = createUpgradeChoices(state);
  state.upgradeChoices = choices;
  state.phase = choices.length > 0 ? "level-up" : "playing";
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
      player.invulnerable = Math.max(player.invulnerable, 0.35 + nextLevel * 0.12);
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
  continuePendingLevelUps(state);
}
