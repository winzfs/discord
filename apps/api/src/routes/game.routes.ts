import { Hono } from "hono";
import { authRequired } from "../middleware/authRequired";
import { getGameRunStatus, saveGameRun } from "../services/gameRunService";
import {
  listHeroSpriteScales,
  resetHeroSpriteScale,
  saveHeroSpriteScale,
} from "../services/heroSpriteScaleService";
import type { AppEnv } from "../utils/env";
import { fail, ok } from "../utils/response";

export const gameRoutes = new Hono<AppEnv>();

gameRoutes.get("/status", (c) => ok(c, getGameRunStatus()));

gameRoutes.get("/hero-sprite-scales", async (c) => {
  const data = await listHeroSpriteScales(c.env.DB);
  return ok(c, data);
});

gameRoutes.post("/hero-sprite-scales", async (c) => {
  const input = await c.req.json().catch(() => ({}));

  try {
    const scale = await saveHeroSpriteScale(c.env.DB, null, input);
    return ok(c, { status: "saved", scale }, 201);
  } catch (error) {
    return fail(c, "invalid_sprite_scale", error instanceof Error ? error.message : "스케일 저장에 실패했습니다.");
  }
});

gameRoutes.delete("/hero-sprite-scales/:heroId", async (c) => {
  try {
    const result = await resetHeroSpriteScale(c.env.DB, c.req.param("heroId"));
    return ok(c, result);
  } catch (error) {
    return fail(c, "invalid_sprite_scale", error instanceof Error ? error.message : "스케일 초기화에 실패했습니다.");
  }
});

gameRoutes.post("/runs", authRequired, async (c) => {
  const session = c.get("user");
  const input = await c.req.json().catch(() => ({}));
  const run = await saveGameRun(c.env.DB, session.userId, input);
  return ok(c, { status: "saved", run }, 201);
});
