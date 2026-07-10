import type {
  HeroStrikeState,
  StageProtocolId,
  StageProtocolOption,
} from "./heroStrikeTypes";

type ProtocolMetadata = Omit<StageProtocolOption, "description" | "currentLevel" | "nextLevel" | "maxLevel">;

const MAX_PROTOCOL_LEVEL = 3;

const PROTOCOL_POOL: ProtocolMetadata[] = [
  { id: "vital-core", title: "생체 코어", icon: "♥", rarity: "rare" },
  { id: "reactor-boost", title: "반응로 증폭", icon: "◆", rarity: "epic" },
  { id: "combat-data", title: "전투 데이터", icon: "▣", rarity: "rare" },
  { id: "precision-link", title: "정밀 링크", icon: "✧", rarity: "epic" },
  { id: "pulse-sync", title: "펄스 동기화", icon: "ϟ", rarity: "epic" },
  { id: "salvage-array", title: "회수 배열", icon: "◎", rarity: "rare" },
  { id: "bounty-network", title: "현상금 네트워크", icon: "★", rarity: "rare" },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function describeProtocol(id: StageProtocolId, level: number) {
  switch (id) {
    case "vital-core": return `최대 체력 +1 · 체력 ${level + 1} 회복`;
    case "reactor-boost": return `전체 무기 피해 누적 +${level * 12}%`;
    case "combat-data": return `경험치 획득량 +${level * 18}%`;
    case "precision-link": return `치명타 +${level * 5}% · 배율 +${(level * 0.1).toFixed(1)}`;
    case "pulse-sync": return `모든 자동사격 간격 누적 -${level * 8}%`;
    case "salvage-array": return `자석 범위 +${level * 70} · 보호막 ${Math.min(3, level)}칸`;
    case "bounty-network": return `처치 점수 +${level * 20}%`;
  }
}

function makeProtocolOption(state: HeroStrikeState, metadata: ProtocolMetadata): StageProtocolOption {
  const currentLevel = state.protocolLevels[metadata.id] ?? 0;
  const nextLevel = currentLevel + 1;
  return {
    ...metadata,
    description: describeProtocol(metadata.id, nextLevel),
    currentLevel,
    nextLevel,
    maxLevel: MAX_PROTOCOL_LEVEL,
  };
}

export function createStageProtocolChoices(state: HeroStrikeState) {
  return shuffle(
    PROTOCOL_POOL
      .filter((protocol) => (state.protocolLevels[protocol.id] ?? 0) < MAX_PROTOCOL_LEVEL)
      .map((protocol) => makeProtocolOption(state, protocol)),
  ).slice(0, 3);
}

export function applyStageProtocol(state: HeroStrikeState, id: StageProtocolId) {
  const player = state.player;
  const nextLevel = Math.min(MAX_PROTOCOL_LEVEL, (state.protocolLevels[id] ?? 0) + 1);
  state.protocolLevels[id] = nextLevel;

  switch (id) {
    case "vital-core":
      player.maxHp += 1;
      player.hp = Math.min(player.maxHp, player.hp + nextLevel + 1);
      break;
    case "reactor-boost":
      player.campaignDamageMultiplier *= 1.12;
      break;
    case "combat-data":
      player.xpGainMultiplier = 1 + nextLevel * 0.18;
      break;
    case "precision-link":
      player.bonusCriticalChance = nextLevel * 0.05;
      player.bonusCriticalMultiplier = nextLevel * 0.1;
      break;
    case "pulse-sync":
      player.campaignFireRateMultiplier *= 0.92;
      break;
    case "salvage-array":
      player.campaignMagnetBonus = nextLevel * 70;
      player.shield = Math.min(5, player.shield + Math.min(3, nextLevel));
      break;
    case "bounty-network":
      player.scoreMultiplier = 1 + nextLevel * 0.2;
      break;
  }

  state.protocolChoices = [];
}

export function applyCombatRankMilestone(state: HeroStrikeState, clearedStageNumber: number) {
  if (clearedStageNumber % 3 !== 0) return false;

  state.combatRank += 1;
  const player = state.player;
  player.campaignDamageMultiplier *= 1.08;
  player.campaignFireRateMultiplier *= 0.95;
  player.maxHp += 1;
  player.hp = player.maxHp;
  player.shield = Math.min(5, player.shield + 2);
  player.ultimate = player.ultimateMax;
  state.score += state.combatRank * 1000;
  return true;
}