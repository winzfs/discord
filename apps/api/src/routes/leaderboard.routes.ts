import { Hono } from "hono";
import { getLeaderboardPlaceholder } from "../services/leaderboardService";
import { ok } from "../utils/response";

export const leaderboardRoutes = new Hono();

leaderboardRoutes.get("/", (c) => ok(c, getLeaderboardPlaceholder()));
