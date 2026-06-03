import { createMiddleware } from "hono/factory";
import { fail } from "../utils/response";

export const authRequired = createMiddleware(async (c, next) => {
  // TODO: Discord OAuth 세션 검증 구현 전 placeholder입니다.
  const mockUserEnabled = c.req.header("x-mock-user") === "enabled";
  if (!mockUserEnabled) return fail(c, "unauthorized", "로그인이 필요합니다.", 401);
  await next();
});
