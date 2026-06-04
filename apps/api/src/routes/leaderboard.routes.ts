import { Hono } from "hono";
import { getLeaderboard } from "../services/leaderboardService";
import type { AppEnv } from "../utils/env";
import { ok } from "../utils/response";

export const leaderboardRoutes = new Hono<AppEnv>();

leaderboardRoutes.get("/", async (c) => {
  const mode = c.req.query("mode") ?? "single_random_wave_defense";
  const limit = Number(c.req.query("limit") ?? 20);
  return ok(c, await getLeaderboard(c.env.DB, mode, limit));
});
