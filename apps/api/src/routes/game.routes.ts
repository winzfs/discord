import { Hono } from "hono";
import { authRequired } from "../middleware/authRequired";
import { getGameRunStatus, saveGameRun } from "../services/gameRunService";
import type { AppEnv } from "../utils/env";
import { ok } from "../utils/response";

export const gameRoutes = new Hono<AppEnv>();

gameRoutes.get("/status", (c) => ok(c, getGameRunStatus()));

gameRoutes.post("/runs", authRequired, async (c) => {
  const session = c.get("user");
  const input = await c.req.json().catch(() => ({}));
  const run = await saveGameRun(c.env.DB, session.userId, input);
  return ok(c, { status: "saved", run }, 201);
});
