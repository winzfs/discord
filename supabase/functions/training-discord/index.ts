import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const discordClientId = Deno.env.get("DISCORD_CLIENT_ID");
const discordClientSecret = Deno.env.get("DISCORD_CLIENT_SECRET");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase runtime environment is not configured");
}

const database = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type GameKey = "reaction" | "widow";

type ScorePayload = {
  action?: unknown;
  guildId?: unknown;
  gameKey?: unknown;
  score?: unknown;
  accuracy?: unknown;
  avgReactionMs?: unknown;
  headshotRate?: unknown;
  maxCombo?: unknown;
  limit?: unknown;
  code?: unknown;
};

type DiscordIdentity = {
  guildId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type DiscordUser = {
  id?: unknown;
  username?: unknown;
  global_name?: unknown;
  avatar?: unknown;
};

type DiscordMember = {
  nick?: unknown;
  avatar?: unknown;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isGameKey(value: unknown): value is GameKey {
  return value === "reaction" || value === "widow";
}

function isDiscordId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{17,20}$/.test(value);
}

function asInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function sanitizeDisplayName(value: unknown, fallback: string): string {
  const candidate = typeof value === "string"
    ? value.replace(/[<>\u0000-\u001f\u007f]/g, "").trim().slice(0, 64)
    : "";
  return candidate || fallback.slice(0, 64) || "Discord User";
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function avatarUrl(guildId: string, userId: string, userAvatar: unknown, memberAvatar: unknown): string | null {
  if (typeof memberAvatar === "string" && memberAvatar) {
    return `https://cdn.discordapp.com/guilds/${guildId}/users/${userId}/avatars/${memberAvatar}.png?size=64`;
  }
  if (typeof userAvatar === "string" && userAvatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${userAvatar}.png?size=64`;
  }
  return null;
}

async function getDiscordIdentity(accessToken: string, guildId: string): Promise<DiscordIdentity> {
  if (!accessToken) throw new Error("missing access token");
  if (!isDiscordId(guildId)) throw new Error("invalid guild id");

  const userResponse = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!userResponse.ok) throw new Error("discord token verification failed");
  const user = await userResponse.json() as DiscordUser;

  if (!isDiscordId(user.id) || typeof user.username !== "string" || !user.username) {
    throw new Error("invalid discord user");
  }

  const memberResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!memberResponse.ok) throw new Error("discord guild membership unavailable");
  const member = await memberResponse.json() as DiscordMember;

  const globalName = typeof user.global_name === "string" ? user.global_name : "";
  const displayName = sanitizeDisplayName(member.nick, sanitizeDisplayName(globalName, user.username));

  return {
    guildId,
    userId: user.id,
    username: user.username.slice(0, 32),
    displayName,
    avatarUrl: avatarUrl(guildId, user.id, user.avatar, member.avatar),
  };
}

async function exchangeCode(payload: ScorePayload): Promise<Response> {
  if (!discordClientId || !discordClientSecret) {
    return json({ error: "missing discord oauth configuration" }, 500);
  }

  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  if (!code || code.length > 2048) return json({ error: "invalid authorization code" }, 400);
  if (!isDiscordId(payload.guildId)) return json({ error: "invalid guild id" }, 400);

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: "authorization_code",
      code,
    }),
  });
  const tokenPayload = await tokenResponse.json().catch(() => null) as {
    access_token?: unknown;
    expires_in?: unknown;
  } | null;

  if (!tokenResponse.ok || typeof tokenPayload?.access_token !== "string") {
    return json({ error: "discord token exchange failed" }, 401);
  }

  try {
    const profile = await getDiscordIdentity(tokenPayload.access_token, payload.guildId);
    return json({
      accessToken: tokenPayload.access_token,
      expiresIn: typeof tokenPayload.expires_in === "number" ? tokenPayload.expires_in : null,
      profile,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "discord identity lookup failed" }, 403);
  }
}

async function requireIdentity(request: Request, guildId: unknown): Promise<DiscordIdentity> {
  const token = bearerToken(request);
  if (!token) throw new Error("missing access token");
  if (!isDiscordId(guildId)) throw new Error("invalid guild id");
  return getDiscordIdentity(token, guildId);
}

function parseMetrics(payload: ScorePayload) {
  const score = asInteger(payload.score);
  const accuracy = asInteger(payload.accuracy);
  const avgReactionMs = payload.avgReactionMs == null ? null : asInteger(payload.avgReactionMs);
  const headshotRate = payload.headshotRate == null ? null : asInteger(payload.headshotRate);
  const maxCombo = asInteger(payload.maxCombo) ?? 0;

  if (!isGameKey(payload.gameKey)) return { error: "invalid game key" } as const;
  const scoreLimit = payload.gameKey === "reaction" ? 50_000 : 100_000;
  if (score === null || score < 0 || score > scoreLimit) return { error: "invalid score" } as const;
  if (accuracy === null || accuracy < 0 || accuracy > 100) return { error: "invalid accuracy" } as const;
  if (avgReactionMs !== null && (avgReactionMs < 50 || avgReactionMs > 10_000)) {
    return { error: "invalid average reaction" } as const;
  }
  if (headshotRate !== null && (headshotRate < 0 || headshotRate > 100)) {
    return { error: "invalid headshot rate" } as const;
  }
  if (maxCombo < 0 || maxCombo > 9_999) return { error: "invalid combo" } as const;

  return {
    value: {
      gameKey: payload.gameKey,
      score,
      accuracy,
      avgReactionMs,
      headshotRate,
      maxCombo,
    },
  } as const;
}

async function leaderboard(request: Request, payload: ScorePayload): Promise<Response> {
  if (!isGameKey(payload.gameKey)) return json({ error: "invalid game key" }, 400);
  const limitValue = asInteger(payload.limit) ?? 10;
  const limit = Math.max(1, Math.min(50, limitValue));

  let identity: DiscordIdentity;
  try {
    identity = await requireIdentity(request, payload.guildId);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "discord verification failed" }, 401);
  }

  const { data, error } = await database
    .from("training_discord_scores")
    .select("discord_user_id, display_name, avatar_url, score, accuracy, avg_reaction_ms, headshot_rate, max_combo, updated_at")
    .eq("guild_id", identity.guildId)
    .eq("game_key", payload.gameKey)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) return json({ error: "failed to load server leaderboard" }, 500);

  return json({
    guildId: identity.guildId,
    viewerUserId: identity.userId,
    entries: (data ?? []).map((row, index) => ({
      rank: index + 1,
      discordUserId: row.discord_user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      score: row.score,
      accuracy: row.accuracy,
      avgReactionMs: row.avg_reaction_ms,
      headshotRate: row.headshot_rate,
      maxCombo: row.max_combo,
      updatedAt: row.updated_at,
    })),
  });
}

async function submit(request: Request, payload: ScorePayload): Promise<Response> {
  const metrics = parseMetrics(payload);
  if ("error" in metrics) return json({ error: metrics.error }, 400);

  let identity: DiscordIdentity;
  try {
    identity = await requireIdentity(request, payload.guildId);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "discord verification failed" }, 401);
  }

  const value = metrics.value;
  const { data: previous, error: previousError } = await database
    .from("training_discord_scores")
    .select("score")
    .eq("guild_id", identity.guildId)
    .eq("discord_user_id", identity.userId)
    .eq("game_key", value.gameKey)
    .maybeSingle();

  if (previousError) return json({ error: "failed to read current score" }, 500);

  const improved = !previous || value.score > previous.score;
  const profileValues = {
    username: identity.username,
    display_name: identity.displayName,
    avatar_url: identity.avatarUrl,
  };

  if (!previous) {
    const { error } = await database.from("training_discord_scores").insert({
      guild_id: identity.guildId,
      discord_user_id: identity.userId,
      ...profileValues,
      game_key: value.gameKey,
      score: value.score,
      accuracy: value.accuracy,
      avg_reaction_ms: value.avgReactionMs,
      headshot_rate: value.headshotRate,
      max_combo: value.maxCombo,
    });
    if (error) return json({ error: "failed to save score" }, 500);
  } else if (improved) {
    const { error } = await database
      .from("training_discord_scores")
      .update({
        ...profileValues,
        score: value.score,
        accuracy: value.accuracy,
        avg_reaction_ms: value.avgReactionMs,
        headshot_rate: value.headshotRate,
        max_combo: value.maxCombo,
        updated_at: new Date().toISOString(),
      })
      .eq("guild_id", identity.guildId)
      .eq("discord_user_id", identity.userId)
      .eq("game_key", value.gameKey);
    if (error) return json({ error: "failed to update score" }, 500);
  } else {
    const { error } = await database
      .from("training_discord_scores")
      .update(profileValues)
      .eq("guild_id", identity.guildId)
      .eq("discord_user_id", identity.userId)
      .eq("game_key", value.gameKey);
    if (error) return json({ error: "failed to refresh discord profile" }, 500);
  }

  const bestScore = Math.max(previous?.score ?? 0, value.score);
  const { count, error: rankError } = await database
    .from("training_discord_scores")
    .select("discord_user_id", { count: "exact", head: true })
    .eq("guild_id", identity.guildId)
    .eq("game_key", value.gameKey)
    .gt("score", bestScore);

  if (rankError) return json({ error: "score saved but rank lookup failed" }, 500);

  return json({
    saved: true,
    improved,
    bestScore,
    rank: (count ?? 0) + 1,
    displayName: identity.displayName,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    if (url.searchParams.get("action") !== "config") return json({ error: "not found" }, 404);
    if (!discordClientId) return json({ error: "missing discord oauth configuration" }, 500);
    return json({ clientId: discordClientId });
  }

  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

  let payload: ScorePayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (payload.action === "exchange") return exchangeCode(payload);
  if (payload.action === "leaderboard") return leaderboard(request, payload);
  if (payload.action === "submit") return submit(request, payload);
  return json({ error: "invalid action" }, 400);
});
