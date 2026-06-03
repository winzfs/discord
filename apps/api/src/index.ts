import { Hono } from "hono";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { gameRoutes } from "./routes/game.routes";
import { healthRoutes } from "./routes/health.routes";
import { leaderboardRoutes } from "./routes/leaderboard.routes";
import { meRoutes } from "./routes/me.routes";
import { errorHandler } from "./middleware/errorHandler";
import type { AppEnv } from "./utils/env";

const app = new Hono<AppEnv>();

app.onError(errorHandler);

app.route("/health", healthRoutes);
app.route("/api/health", healthRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/me", meRoutes);
app.route("/api/game", gameRoutes);
app.route("/api/leaderboard", leaderboardRoutes);
app.route("/api/admin", adminRoutes);

export default app;
