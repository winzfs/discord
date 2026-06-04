import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../utils/env";
import { isMockAuthEnabled } from "../utils/env";
import { fail } from "../utils/response";
import { getSession } from "../utils/session";

export const authRequired = createMiddleware<AppEnv>(async (c, next) => {
  const session = await getSession(c);
  if (session) {
    c.set("user", session);
    await next();
    return;
  }

  const mockUserEnabled = isMockAuthEnabled(c.env) && c.req.header("x-mock-user") === "enabled";
  if (!mockUserEnabled) return fail(c, "unauthorized", "로그인이 필요합니다.", 401);

  c.set("user", {
    userId: "mock-user",
    discordId: "mock-discord-user",
    isGuildMember: true,
    isAdmin: false,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  await next();
});
