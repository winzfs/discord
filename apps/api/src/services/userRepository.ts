import type { DiscordProfile } from "./discordOAuthService";

export type StoredUser = {
  id: string;
  discordId: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  isGuildMember: boolean;
  isAdmin: boolean;
};

function createUserId(discordId: string) {
  return `discord:${discordId}`;
}

function nowIso() {
  return new Date().toISOString();
}

export async function upsertUserFromDiscord(db: D1Database | undefined, profile: DiscordProfile): Promise<StoredUser> {
  const user: StoredUser = {
    id: createUserId(profile.discordId),
    discordId: profile.discordId,
    username: profile.username,
    globalName: profile.globalName,
    avatarUrl: profile.avatarUrl,
    isGuildMember: profile.isGuildMember,
    isAdmin: profile.isAdmin,
  };

  if (!db) return user;

  const timestamp = nowIso();
  await db
    .prepare(
      `INSERT INTO users (
        id, discord_id, username, global_name, avatar_url, is_guild_member, is_admin, created_at, updated_at, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        username = excluded.username,
        global_name = excluded.global_name,
        avatar_url = excluded.avatar_url,
        is_guild_member = excluded.is_guild_member,
        is_admin = excluded.is_admin,
        updated_at = excluded.updated_at,
        last_login_at = excluded.last_login_at`,
    )
    .bind(
      user.id,
      user.discordId,
      user.username,
      user.globalName ?? null,
      user.avatarUrl ?? null,
      user.isGuildMember ? 1 : 0,
      user.isAdmin ? 1 : 0,
      timestamp,
      timestamp,
      timestamp,
    )
    .run();

  return user;
}

export async function getUserById(db: D1Database | undefined, userId: string): Promise<StoredUser | null> {
  if (!db) return null;

  const row = await db
    .prepare(
      `SELECT id, discord_id, username, global_name, avatar_url, is_guild_member, is_admin
       FROM users
       WHERE id = ?`,
    )
    .bind(userId)
    .first<{
      id: string;
      discord_id: string;
      username: string;
      global_name: string | null;
      avatar_url: string | null;
      is_guild_member: number;
      is_admin: number;
    }>();

  if (!row) return null;
  return {
    id: row.id,
    discordId: row.discord_id,
    username: row.username,
    globalName: row.global_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    isGuildMember: row.is_guild_member === 1,
    isAdmin: row.is_admin === 1,
  };
}
