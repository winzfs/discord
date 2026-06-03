import { createMiddleware } from "hono/factory";
import { fail } from "../utils/response";
import { isMockAuthEnabled } from "../utils/env";

export const adminRequired = createMiddleware(async (c, next) => {
  // TODO: ADMIN_DISCORD_IDS 또는 Discord 역할 기반 관리자 검증으로 교체합니다.
  const mockAdminEnabled = isMockAuthEnabled(c.env) && c.req.header("x-mock-admin") === "enabled";
  if (!mockAdminEnabled) return fail(c, "forbidden", "관리자 권한이 필요합니다.", 403);
  await next();
});
