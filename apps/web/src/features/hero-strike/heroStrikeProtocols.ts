import type {
  HeroStrikeState,
  StageProtocolId,
  StageProtocolOption,
} from "./heroStrikeTypes";

type ProtocolMetadata = Omit<StageProtocolOption, "description" | "currentLevel" | "nextLevel" | "maxLevel">;

const MAX_PROTOCOL_LEVEL = 1;

const PROTOCOL_POOL: ProtocolMetadata[] = [
  { id: "reactor-boost", title: "FOCUS ASSAULT", icon: "◎", rarity: "epic" },
  { id: "pulse-sync", title: "MOBILE ARSENAL", icon: "»", rarity: "epic" },
  { id: "precision-link", title: "BREAK HUNTER", icon: "✧", rarity: "epic" },
  { id: "blink-capacitor", title: "AEGIS RUNNER", icon: "⬡", rarity: "epic" },
  { id: "vital-core", title: "SWARM COMMAND", icon: "⌁", rarity: "epic" },
];

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function describeProtocol(id: StageProtocolId): string {
  switch (id) {
    case "reactor-boost": return "FOCUS 피해 +20% · 락온 사격 간격 -8%";
    case "pulse-sync": return "DRIVE 피해와 연사 강화 · 이동 화력 손실 완화";
    case "precision-link": return "보스 약점 피해·BREAK 압력 대폭 증가";
    case "blink-capacitor": return "최대 체력·보호막 +1 · 블링크 3회";
    case "vital-core": return "선택한 보조무기 +1 · FOCUS 표적을 공유";
  }
  return "";
}

function makeProtocolOption(state: HeroStrikeState, metadata: ProtocolMetadata): StageProtocolOption {
  const currentLevel = state.protocolLevels[metadata.id] ?? 0;
  return {
    ...metadata,
    description: describeProtocol(metadata.id),
    currentLevel,
    nextLevel: 1,
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

function upgradeSelectedSupport(state: HeroStrikeState) {
  const player = state.player;
  if (state.loadout.support === "homing-missile") {
    player.homingMissileLevel = Math.min(3, player.homingMissileLevel + 1);
    state.upgradeLevels["homing-missile"] = player.homingMissileLevel;
    player.missileCooldown = 0;
  } else if (state.loadout.support === "drone-wing") {
    player.supportDroneLevel = Math.min(3, player.supportDroneLevel + 1);
    state.upgradeLevels["drone-wing"] = player.supportDroneLevel;
    player.supportDroneCooldown = 0;
  } else {
    player.sideCannonLevel = Math.min(2, player.sideCannonLevel + 1);
    state.upgradeLevels["side-cannons"] = player.sideCannonLevel;
  }
}

export function applyStageProtocol(state: HeroStrikeState, id: StageProtocolId) {
  const player = state.player;
  state.protocolLevels[id] = 1;

  if (id === "precision-link") {
    player.bonusCriticalChance += 0.06;
    player.bonusCriticalMultiplier += 0.12;
  } else if (id === "blink-capacitor") {
    player.maxHp += 1;
    player.hp = Math.min(player.maxHp, player.hp + 2);
    player.shield = Math.min(5, player.shield + 1);
    player.blinkMaxCharges = 3;
    player.blinkCharges = 3;
    player.blinkRechargeDuration = 4.6;
    player.blinkRecharge = 0;
  } else if (id === "vital-core") {
    upgradeSelectedSupport(state);
  }

  state.protocolChoices = [];
}
