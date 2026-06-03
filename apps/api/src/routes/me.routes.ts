import { Hono } from "hono";
import { authRequired } from "../middleware/authRequired";
import { ok } from "../utils/response";

export const meRoutes = new Hono();

meRoutes.get("/", authRequired, (c) => ok(c, { id: "mock-user", displayName: "Mock User" }));
