import { Hono } from "hono";
import { adminRequired } from "../middleware/adminRequired";
import type { AppEnv } from "../utils/env";
import { ok } from "../utils/response";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.get("/summary", adminRequired, (c) => ok(c, { recentRuns: [], adminLogs: [] }));
