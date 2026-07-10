import type { HeroStrikeState, UpgradeId, UpgradeOption } from "./heroStrikeTypes";

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "rapid-fire", title: "속사 모듈", description: "공격 속도 +18%", icon: "⚡", rarity: "common" },
  { id: "twin-shot", title: "펄스 확장", description: "정면 탄환 수 +1", icon: "✦", rarity: "rare" },
  { id: "power-core", title: "고출력 코어", description: "모든 무기 공격력 +25%", icon: "◆", rarity: "common" },
  { id: "piercing", title: "관통 탄환", description: "기본탄 관통 횟수 +1", icon: "➤", rarity: "rare" },
  { id: "magnet", title: "회수 자석", description: "경험치 흡수 범위 증가", icon: "◎", rarity: "common" },
  { id: "shield", title: "시간 방벽", description: "보호막 1칸 획득", icon: "⬡", rarity: "epic" },
  { id: "pulse-drive", title: "펄스 드라이브", description: "궁극기 게이지 즉시 충전", icon: "◉", rarity: "rare" },
  { id: "overclock", title: "오버클럭", description: "오버드라이브 화력 강화", icon: "∞", rarity: "epic" },
  { id: "homing-missile", title: "유도 미사일", description: "영구 자동 추적 미사일 · 재선택 시 강화", icon: "🚀", rarity: "epic" },
  { id: "drone-wing", title: "드론 편대", description: "양옆 지원 드론 영구 배치", icon: "⌁", rarity: "epic" },
  { id: "side-cannons", title: "측면 포대", description: "좌우 대각선 보조탄 추가", icon: "⋘", rarity: "rare" },
  { id: "rear-guard", title: "후방 방어포", description: "아래 방향 방어탄 자동 발사", icon: "⇊", rarity: "rare" },
  { id: "explosive-rounds", title: "폭발 탄두", description: "기본탄 명중 시 주변 범위 피해", icon: "✹", rarity: "epic" },
  { id: "chain-core", title: "연쇄 코어", description: "명중 피해가 주변 적에게 전이", icon: "ϟ", rarity: "epic" },
  { id: "critical-core", title: "치명 코어", description: "치명타 확률과 배율 증가", icon: "✧", rarity: "rare" },
];

const MAX_LEVELS: Record<UpgradeId, number> = {
  "rapid-fire": 5,
  "twin-shot": 3,
  "power-core": 5,
  piercing: 3,
  magnet: 5,
  shield: 5,
  "pulse-drive": 5,
  overclock: 5,
  "homing-missile": 5,
  "drone-wing": 4,
  "side-cannons": 3,
  "rear-guard": 3,
  "explosive-rounds": 4,
  "chain-core": 3,
  "critical-core": 5,
};

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createUpgradeChoices(state: HeroStrikeState) {
  const weighted = UPGRADE_POOL.filter((upgrade) => {
    const level = state.upgradeLevels[upgrade.id] ?? 0;
    if (upgrade.id === "shield" && state.player.shield >= 5) return false;
    return level < MAX_LEVELS[upgrade.id];
  });
  return shuffle(weighted).slice(0, 3);
}

export function applyUpgrade(state: HeroStrikeState, id: UpgradeId) {
  const player = state.player;
  const nextLevel = (state.upgradeLevels[id] ?? 0) + 1;
  state.upgradeLevels[id] = nextLevel;

  switch (id) {
    case "rapid-fire": player.fireInterval = Math.max(0.075, player.fireInterval * 0.82); break;
    case "twin-shot": player.bulletCount = Math.min(5, player.bulletCount + 1); break;
    case "power-core": player.damage *= 1.25; break;
    case "piercing": player.pierce += 1; break;
    case "magnet": player.magnetRadius += 48; break;
    case "shield": player.shield = Math.min(5, player.shield + 1); break;
    case "pulse-drive": player.ultimate = Math.min(player.ultimateMax, player.ultimate + 32); break;
    case "overclock": player.overdriveLevel += 1; break;
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
      player.criticalChance = Math.min(0.42, player.criticalChance + 0.07);
      player.criticalMultiplier = Math.min(2.7, player.criticalMultiplier + 0.15);
      break;
  }

  state.upgradeChoices = [];
  state.phase = "playing";
}