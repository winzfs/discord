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

function makeUpgradeOption(state: HeroStrikeState, metadata: UpgradeMetadata): UpgradeOption {
  const currentLevel = state.upgradeLevels[metadata.id] ?? 0;
  const nextLevel = currentLevel + 1;
  return {
    ...metadata,
    description: describeUpgradeLevel(metadata.id, nextLevel),
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
  const missile = available.find((upgrade) => upgrade.id === "homing-missile");
  if (state.player.level <= 2 && missile && (state.upgradeLevels["homing-missile"] ?? 0) === 0) {
    choices = replaceLastChoice(choices, missile);
  } else if (!choices.some((choice) => HERO_STRIKE_WEAPON_UPGRADES.has(choice.id))) {
    const weapon = shuffle(available.filter((upgrade) => HERO_STRIKE_WEAPON_UPGRADES.has(upgrade.id)))[0];
    if (weapon) choices = replaceLastChoice(choices, weapon);
  }
  return choices;
}

export function applyUpgrade(state: HeroStrikeState, id: UpgradeId) {
  const player = state.player;
  const nextLevel = (state.upgradeLevels[id] ?? 0) + 1;
  state.upgradeLevels[id] = nextLevel;

  switch (id) {
    case "rapid-fire": player.fireInterval = getRapidFireInterval(nextLevel); break;
    case "twin-shot": player.bulletCount = getForwardBulletCount(nextLevel); break;
    case "power-core": player.damage = getPowerCoreDamage(nextLevel); break;
    case "piercing": player.pierce = nextLevel; break;
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

  state.upgradeChoices = [];
  state.phase = "playing";
}