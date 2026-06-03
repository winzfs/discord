export type AssetCategory = "hero" | "enemy" | "boss" | "skill" | "relic" | "background" | "ui";

export type AssetKey = string;

export type AssetDefinition = {
  key: AssetKey;
  category: AssetCategory;
  src: string;
  alt: string;
};
