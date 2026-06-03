import { Hono } from "hono";
import { getGameRunPlaceholder } from "../services/gameRunService";
import { authRequired } from "../middleware/authRequired";
import { ok } from "../utils/response";

export const gameRoutes = new Hono();

gameRoutes.get("/status", (c) => ok(c, getGameRunPlaceholder()));
gameRoutes.post("/runs", authRequired, (c) => ok(c, { status: "game_run_submit_placeholder" }, 202));
