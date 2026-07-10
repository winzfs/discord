import type { HeroStrikeState, UpgradeId, UpgradeOption } from "./heroStrikeTypes";

const UPGRADE_POOL: UpgradeOption[] = [
  { id: "rapid-fire", title: "속사 모듈", description: "공격 속도 +18%", icon: "⚡", rarity: "common" },
  { id: "twin-shot", title: "펄스 확장", description: "탄환 수 +1", icon: "✦", rarity: "rare" },
  { id: "power-core", title: "고출력 코어", description: "공격력 +25%", icon: "◆", rarity: "common" },
  { id: "piercing", title: "관통 탄환", description: "관통 횟수 +1", icon: "➤", rarity: "rare" },
  { id: "magnet", title: "회수 자석", description: "경험치 흡수 범위 증가", icon: "◎", rarity: "common" },
  { id: "shield", title: "시간 방벽", description: "보호막 1칸 획득", icon: "⬡", rarity: "epic" },
  { id: "pulse-drive", title: "펄스 드라이브", description: "궁극기 충전량 +30%", icon: "◉", rarity: "rare" },
  { id: "overclock", title: "오버클럭", description: "오버드라이브 화력 강화", icon: "∞", rarity: "epic" },
];

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
    if (upgrade.id === "twin-shot") return level < 3;
    if (upgrade.id === "piercing") return level < 3;
    if (upgrade.id === "shield") return state.player.shield < 2;
    return level < 5;
  });
  return shuffle(weighted).slice(0, 3);
}

export function applyUpgrade(state: HeroStrikeState, id: UpgradeId) {
  const player = state.player;
  state.upgradeLevels[id] = (state.upgradeLevels[id] ?? 0) + 1;

  switch (id) {
    case "rapid-fire": player.fireInterval = Math.max(0.075, player.fireInterval * 0.82); break;
    case "twin-shot": player.bulletCount = Math.min(5, player.bulletCount + 1); break;
    case "power-core": player.damage *= 1.25; break;
    case "piercing": player.pierce += 1; break;
    case "magnet": player.magnetRadius += 48; break;
    case "shield": player.shield = Math.min(2, player.shield + 1); break;
    case "pulse-drive": player.ultimate = Math.min(player.ultimateMax, player.ultimate + 32); break;
    case "overclock": player.overdriveLevel += 1; break;
  }

  state.upgradeChoices = [];
  state.phase = "playing";
}
