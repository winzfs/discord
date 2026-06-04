import { Hono } from "hono";
import { adminRequired } from "../middleware/adminRequired";
import { getAdminSummary } from "../services/adminSummaryService";
import type { AppEnv } from "../utils/env";
import { ok } from "../utils/response";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.get("/summary", adminRequired, async (c) => ok(c, await getAdminSummary(c.env.DB)));
