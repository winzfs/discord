import { Hono } from "hono";
import { ok } from "../utils/response";

export const healthRoutes = new Hono();

healthRoutes.get("/", (c) => ok(c, { status: "healthy", service: "discord-random-defense-api" }));
