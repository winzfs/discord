import { createMiddleware } from "hono/factory";
import { fail } from "../utils/response";
import { isMockAuthEnabled } from "../utils/env";

export const authRequired = createMiddleware(async (c, next) => {
  // TODO: Discord OAuth 세션 검증으로 교체합니다.
  const mockUserEnabled = isMockAuthEnabled(c.env) && c.req.header("x-mock-user") === "enabled";
  if (!mockUserEnabled) return fail(c, "unauthorized", "로그인이 필요합니다.", 401);
  await next();
});
