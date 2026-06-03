export type AppEnv = {
  Bindings: {
    DB?: D1Database;
    DISCORD_CLIENT_ID?: string;
    DISCORD_CLIENT_SECRET?: string;
    DISCORD_REDIRECT_URI?: string;
    DISCORD_GUILD_ID?: string;
    DISCORD_INVITE_URL?: string;
    SESSION_SECRET?: string;
    ADMIN_DISCORD_IDS?: string;
    PUBLIC_APP_URL?: string;
    ALLOW_MOCK_AUTH?: string;
  };
};

export function getEnvValue(env: AppEnv["Bindings"], key: keyof AppEnv["Bindings"]): string | undefined {
  const value = env[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function isMockAuthEnabled(env: AppEnv["Bindings"]): boolean {
  return getEnvValue(env, "ALLOW_MOCK_AUTH") === "true";
}
