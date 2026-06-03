import type { AssetDefinition, AssetKey } from "./assetTypes";

const fallbackHeroKey = "hero.placeholder";

export const assetManifest: Record<AssetKey, AssetDefinition> = {
  "hero.placeholder": {
    key: "hero.placeholder",
    category: "hero",
    src: "/assets/placeholder/hero-placeholder.svg",
    alt: "영웅 placeholder",
  },
  "enemy.placeholder": {
    key: "enemy.placeholder",
    category: "enemy",
    src: "/assets/placeholder/enemy-placeholder.svg",
    alt: "적 placeholder",
  },
  "boss.placeholder": {
    key: "boss.placeholder",
    category: "boss",
    src: "/assets/placeholder/boss-placeholder.svg",
    alt: "보스 placeholder",
  },
  "skill.placeholder": {
    key: "skill.placeholder",
    category: "skill",
    src: "/assets/placeholder/skill-placeholder.svg",
    alt: "스킬 placeholder",
  },
  "relic.placeholder": {
    key: "relic.placeholder",
    category: "relic",
    src: "/assets/placeholder/relic-placeholder.svg",
    alt: "유물 placeholder",
  },
  "background.placeholder": {
    key: "background.placeholder",
    category: "background",
    src: "/assets/placeholder/background-placeholder.svg",
    alt: "배경 placeholder",
  },
};

export function resolveAsset(key?: AssetKey): AssetDefinition {
  if (!key) return assetManifest[fallbackHeroKey];
  return assetManifest[key] ?? assetManifest[fallbackHeroKey];
}
