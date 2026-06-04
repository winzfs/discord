import type { AppEnv } from "../utils/env";
import { getEnvValue } from "../utils/env";

const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const DISCORD_AUTHORIZE_URL = "https://discord.com/oauth2/authorize";
const DISCORD_TOKEN_URL = `${DISCORD_API_BASE_URL}/oauth2/token`;

type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type DiscordUser = {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
};

type DiscordGuild = {
  id: string;
  name: string;
  owner?: boolean;
  permissions?: string;
};

export type DiscordProfile = {
  discordId: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  isGuildMember: boolean;
  isAdmin: boolean;
};

export function createDiscordAuthorizeUrl(env: AppEnv["Bindings"], state: string) {
  const clientId = getEnvValue(env, "DISCORD_CLIENT_ID");
  const redirectUri = getEnvValue(env, "DISCORD_REDIRECT_URI");
  if (!clientId || !redirectUri) throw new Error("Discord OAuth environment variables are missing");

  const url = new URL(DISCORD_AUTHORIZE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify guilds");
  url.searchParams.set("state", state);
  return url.toString();
}

async function exchangeCodeForToken(env: AppEnv["Bindings"], code: string) {
  const clientId = getEnvValue(env, "DISCORD_CLIENT_ID");
  const clientSecret = getEnvValue(env, "DISCORD_CLIENT_SECRET");
  const redirectUri = getEnvValue(env, "DISCORD_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) throw new Error("Discord OAuth environment variables are missing");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(DISCORD_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) throw new Error(`Discord token exchange failed: ${response.status}`);
  return (await response.json()) as DiscordTokenResponse;
}

async function fetchDiscordJson<T>(path: string, accessToken: string) {
  const response = await fetch(`${DISCORD_API_BASE_URL}${path}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Discord API request failed: ${path} ${response.status}`);
  return (await response.json()) as T;
}

function createAvatarUrl(user: DiscordUser) {
  if (!user.avatar) return undefined;
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
}

function parseAdminIds(env: AppEnv["Bindings"]) {
  return new Set(
    (getEnvValue(env, "ADMIN_DISCORD_IDS") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

export async function fetchDiscordProfileFromCode(env: AppEnv["Bindings"], code: string): Promise<DiscordProfile> {
  const token = await exchangeCodeForToken(env, code);
  const [user, guilds] = await Promise.all([
    fetchDiscordJson<DiscordUser>("/users/@me", token.access_token),
    fetchDiscordJson<DiscordGuild[]>("/users/@me/guilds", token.access_token),
  ]);

  const guildId = getEnvValue(env, "DISCORD_GUILD_ID");
  const adminIds = parseAdminIds(env);

  return {
    discordId: user.id,
    username: user.username,
    globalName: user.global_name ?? undefined,
    avatarUrl: createAvatarUrl(user),
    isGuildMember: guildId ? guilds.some((guild) => guild.id === guildId) : true,
    isAdmin: adminIds.has(user.id),
  };
}
