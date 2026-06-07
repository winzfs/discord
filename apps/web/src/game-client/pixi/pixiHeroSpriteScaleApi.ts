import { apiDelete, apiGet, apiPost } from "../../lib/apiClient";
import { applyHeroSpriteScaleOverrides } from "./pixiHeroSpriteView";

type HeroSpriteScaleListResponse = {
  scales: Record<string, number>;
  status: string;
};

type HeroSpriteScaleSaveResponse = {
  status: "saved";
  scale: {
    heroId: string;
    scale: number;
    updatedAt: string;
    updatedBy: string | null;
  };
};

type HeroSpriteScaleResetResponse = {
  heroId: string;
  status: string;
};

let cachedServerScales: Record<string, number> = {};

function setCachedServerScales(scales: Record<string, number>) {
  cachedServerScales = { ...scales };
  applyHeroSpriteScaleOverrides(cachedServerScales);
}

export async function loadHeroSpriteScaleOverridesFromServer() {
  const data = await apiGet<HeroSpriteScaleListResponse>("/api/game/hero-sprite-scales");
  setCachedServerScales(data.scales ?? {});
  return cachedServerScales;
}

export async function saveHeroSpriteScaleOverrideToServer(heroId: string, scale: number) {
  const data = await apiPost<HeroSpriteScaleSaveResponse>("/api/game/hero-sprite-scales", { heroId, scale });
  cachedServerScales = {
    ...cachedServerScales,
    [data.scale.heroId]: data.scale.scale,
  };
  applyHeroSpriteScaleOverrides(cachedServerScales);
  return data.scale.scale;
}

export async function resetHeroSpriteScaleOverrideOnServer(heroId: string) {
  const data = await apiDelete<HeroSpriteScaleResetResponse>(`/api/game/hero-sprite-scales/${heroId}`);
  const next = { ...cachedServerScales };
  delete next[data.heroId];
  setCachedServerScales(next);
  return data;
}
