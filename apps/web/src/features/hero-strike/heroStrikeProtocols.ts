import type {
  HeroStrikeState,
  StageProtocolId,
  StageProtocolOption,
} from "./heroStrikeTypes";

type ProtocolMetadata = Omit<StageProtocolOption, "description" | "currentLevel" | "nextLevel" | "maxLevel">;

const MAX_PROTOCOL_LEVEL = 2;

const PROTOCOL_POOL: ProtocolMetadata[] = [
  { id: "vital-core", title: "생체 코어", icon: "♥", rarity: "rare" },
  { id: "reactor-boost", title: "반응로 증폭", icon: "◆", rarity: "epic" },
  { id: "precision-link", title: "정밀 링크", icon: "✧", rarity: "epic" },
  { id: "pulse-sync", title: "펄스 동기화", icon: "ϟ", rarity: "epic" },
  { id: "blink-capacitor", title: "블링크 축전기", icon: "»", rarity: "rare" },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function describeProtocol(id: StageProtocolId, level: number): string {
  switch (id) {
    case "vital-core": return `최대 체력 +1 · 체력 ${level + 1} 회복`;
    case "reactor-boost": return `전체 무기 피해 누적 +${level * 7}%`;
    case "precision-link": return `치명타 +${level * 4}% · 배율 +${(level * 0.08).toFixed(2)}`;
    case "pulse-sync": return `모든 자동사격 간격 누적 -${level * 4}%`;
    case "blink-capacitor": return level >= 2 ? "블링크 최대 3회 · 재충전 4.4초" : "블링크 최대 3회 · 재충전 단축";
  }
  return "";
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
      player.campaignDamageMultiplier *= 1.07;
      break;
    case "precision-link":
      player.bonusCriticalChance = nextLevel * 0.04;
      player.bonusCriticalMultiplier = nextLevel * 0.08;
      break;
    case "pulse-sync":
      player.campaignFireRateMultiplier *= 0.96;
      break;
    case "blink-capacitor":
      player.blinkMaxCharges = 3;
      player.blinkCharges = player.blinkMaxCharges;
      player.blinkRechargeDuration = Math.max(4.4, 5.5 - nextLevel * 0.55);
      player.blinkRecharge = 0;
      break;
  }

  state.protocolChoices = [];
}
