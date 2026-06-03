import { Hono } from "hono";
import { getAuthPlaceholder } from "../services/authService";
import { ok } from "../utils/response";

export const authRoutes = new Hono();

authRoutes.get("/discord", (c) => ok(c, getAuthPlaceholder()));
authRoutes.get("/callback", (c) => ok(c, { status: "oauth_callback_placeholder" }));
