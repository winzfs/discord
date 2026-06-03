import type { HeroDefinition } from "../types/hero";

export const heroes: HeroDefinition[] = [
  {
    id: "cassidy",
    displayName: "캐서디",
    role: "damage",
    grade: "rare",
    attackType: "single",
    assetKey: "hero.cassidy",
    skillIds: ["deadeye"],
    tags: ["single-target", "boss-killer"],
  },
  {
    id: "placeholder-tank",
    displayName: "방어형 영웅",
    role: "tank",
    grade: "normal",
    attackType: "control",
    assetKey: "hero.placeholder",
    skillIds: ["shield-pulse"],
    tags: ["delay", "frontline"],
  },
  {
    id: "placeholder-support",
    displayName: "지원형 영웅",
    role: "support",
    grade: "normal",
    attackType: "support",
    assetKey: "hero.placeholder",
    skillIds: ["boost-field"],
    tags: ["buff", "resource"],
  },
];
