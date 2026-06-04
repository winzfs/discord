import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../utils/env";
import { isMockAuthEnabled } from "../utils/env";
import { fail } from "../utils/response";
import { getSession } from "../utils/session";

export const adminRequired = createMiddleware<AppEnv>(async (c, next) => {
  const session = await getSession(c);
  if (session?.isAdmin) {
    c.set("user", session);
    await next();
    return;
  }

  const mockAdminEnabled = isMockAuthEnabled(c.env) && c.req.header("x-mock-admin") === "enabled";
  if (!mockAdminEnabled) return fail(c, "forbidden", "관리자 권한이 필요합니다.", 403);

  c.set("user", {
    userId: "mock-admin",
    discordId: "mock-discord-admin",
    isGuildMember: true,
    isAdmin: true,
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  await next();
});
