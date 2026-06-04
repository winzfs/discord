import { artifacts, heroes, type ArtifactDefinition, type HeroDefinition } from "@discord-random-defense/game";

export type LobbyTabId = "shop" | "heroes" | "battle" | "artifacts";
export type CollectionKind = "hero" | "artifact";

export type Detail = {
  kind: CollectionKind;
  id: string;
  title: string;
  subtitle: string;
  stats: string[];
  owned: boolean;
  level: number;
  progressText: string;
  upgradeCost: number;
  canUpgrade: boolean;
  lockedText?: string;
};

export type HeroProgress = {
  id: string;
  level: number;
  shards: number;
  owned: boolean;
};

export type ArtifactProgress = {
  id: string;
  level: number;
  pieces: number;
  owned: boolean;
};

export type LobbyHero = HeroDefinition & HeroProgress;
export type LobbyArtifact = ArtifactDefinition & ArtifactProgress;

const ownedHeroIds = new Set([
  "spark-runner",
  "rookie-guard",
  "mini-mender",
  "pulse-ranger",
  "barrier-guard",
  "field-medic",
  "plasma-mage",
  "core-knight",
  "overclock-tech",
]);

const ownedArtifactIds = new Set([
  "power-tonic",
  "arcane-manual",
  "vault-chip",
  "coin-cannon",
  "lucky-core",
]);

export const shopItems = [
  { name: "무료 보석", amount: "30", price: "무료", tag: "AD" },
  { name: "초대장", amount: "30", price: "960", tag: "20% 할인" },
  { name: "광산 열쇠", amount: "1", price: "8400", tag: "30% 할인" },
  { name: "폭풍거인", amount: "10", price: "3600", tag: "10% 할인" },
];

export function getHeroUpgradeRequirement(level: number) {
  return Math.min(120, 5 + level * 5);
}

export function getArtifactUpgradeRequirement(level: number) {
  return Math.min(80, 2 + level * 2);
}

export function getCollectionUpgradeCost(kind: CollectionKind, level: number) {
  const base = kind === "hero" ? 650 : 520;
  return base + level * (kind === "hero" ? 350 : 280);
}

export function getHeroPowerAtLevel(hero: HeroDefinition, level: number) {
  return Math.round(hero.power * (1 + Math.max(0, level - 1) * 0.12));
}

export function getArtifactEffectAtLevel(artifact: ArtifactDefinition, level: number) {
  return artifact.baseEffect + Math.max(0, level - 1) * artifact.effectPerLevel;
}

export function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

export const initialHeroes: LobbyHero[] = heroes.map((hero, index) => {
  const owned = ownedHeroIds.has(hero.id);
  const level = owned ? Math.max(1, Math.min(6, index + 1)) : 0;
  const required = getHeroUpgradeRequirement(Math.max(1, level));
  return {
    ...hero,
    level,
    owned,
    shards: owned ? required + 3 + index * 2 : 0,
  };
});

export const initialArtifacts: LobbyArtifact[] = artifacts.map((artifact, index) => {
  const owned = ownedArtifactIds.has(artifact.id);
  const level = owned ? Math.max(1, Math.min(5, index + 1)) : 0;
  const required = getArtifactUpgradeRequirement(Math.max(1, level));
  return {
    ...artifact,
    level,
    owned,
    pieces: owned ? required + 1 + index : 0,
  };
});

export const quests = [
  { title: "영웅 30회 모집", progress: 78 },
  { title: "몬스터 처치", progress: 100 },
  { title: "미션 달성", progress: 62 },
  { title: "공격력 업그레이드", progress: 18 },
];

export const tabs: { id: LobbyTabId; label: string }[] = [
  { id: "shop", label: "상점" },
  { id: "heroes", label: "영웅" },
  { id: "battle", label: "전투" },
  { id: "artifacts", label: "유물" },
];
