import { Hono } from "hono";
import { adminRequired } from "../middleware/adminRequired";
import { ok } from "../utils/response";

export const adminRoutes = new Hono();

adminRoutes.get("/summary", adminRequired, (c) => ok(c, { recentRuns: [], adminLogs: [] }));
