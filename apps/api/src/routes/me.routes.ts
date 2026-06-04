import { Hono } from "hono";
import { authRequired } from "../middleware/authRequired";
import { getUserById } from "../services/userRepository";
import type { AppEnv } from "../utils/env";
import { ok } from "../utils/response";

export const meRoutes = new Hono<AppEnv>();

meRoutes.get("/", authRequired, async (c) => {
  const session = c.get("user");
  const storedUser = await getUserById(c.env.DB, session.userId);

  return ok(c, {
    id: session.userId,
    discordId: session.discordId,
    isGuildMember: session.isGuildMember,
    isAdmin: session.isAdmin,
    profile: storedUser,
  });
});
