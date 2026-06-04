import { Hono } from "hono";
import { createDiscordAuthorizeUrl, fetchDiscordProfileFromCode } from "../services/discordOAuthService";
import { upsertUserFromDiscord } from "../services/userRepository";
import { getEnvValue } from "../utils/env";
import { fail, ok } from "../utils/response";
import { setOAuthStateCookie, setSessionCookie, verifyOAuthStateCookie } from "../utils/session";

export const authRoutes = new Hono();

function createState() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getPostLoginRedirect(env: Record<string, unknown>) {
  const publicAppUrl = getEnvValue(env, "PUBLIC_APP_URL");
  return publicAppUrl ? `${publicAppUrl.replace(/\/$/, "")}/dashboard` : "/dashboard";
}

authRoutes.get("/discord", async (c) => {
  const state = createState();
  await setOAuthStateCookie(c, state);
  return c.redirect(createDiscordAuthorizeUrl(c.env, state), 302);
});

authRoutes.get("/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state") ?? null;

  if (!code) return fail(c, "missing_code", "Discord 인증 코드가 없습니다.", 400);
  if (!(await verifyOAuthStateCookie(c, state))) {
    return fail(c, "invalid_state", "Discord 로그인 요청 검증에 실패했습니다.", 400);
  }

  try {
    const profile = await fetchDiscordProfileFromCode(c.env, code);
    const user = await upsertUserFromDiscord(c.env.DB, profile);

    await setSessionCookie(c, {
      userId: user.id,
      discordId: user.discordId,
      isGuildMember: user.isGuildMember,
      isAdmin: user.isAdmin,
    });

    return c.redirect(getPostLoginRedirect(c.env), 302);
  } catch (error) {
    console.error(error);
    return fail(c, "discord_oauth_failed", "Discord 로그인 처리에 실패했습니다.", 502);
  }
});

authRoutes.get("/status", (c) => ok(c, { provider: "discord", status: "ready" }));
