import { apiDelete, apiPost } from "../../lib/apiClient";
import { loadHeroSpriteScaleOverrides } from "./pixiHeroSpriteView";

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

export async function saveHeroSpriteScaleOverrideToServer(heroId: string, scale: number) {
  const data = await apiPost<HeroSpriteScaleSaveResponse>("/api/game/hero-sprite-scales", { heroId, scale });
  await loadHeroSpriteScaleOverrides(true);
  return data.scale.scale;
}

export async function resetHeroSpriteScaleOverrideOnServer(heroId: string) {
  const data = await apiDelete<HeroSpriteScaleResetResponse>(`/api/game/hero-sprite-scales/${heroId}`);
  await loadHeroSpriteScaleOverrides(true);
  return data;
}
