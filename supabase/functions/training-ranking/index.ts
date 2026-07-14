import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store, max-age=0",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase runtime environment is not configured");
}

const database = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type GameKey = "reaction" | "widow";

type RankingPayload = {
  guildId?: unknown;
  gameKey?: unknown;
  limit?: unknown;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isDiscordId(value: unknown): value is string {
  return typeof value === "string" && /^[0-9]{17,20}$/.test(value);
}

function isGameKey(value: unknown): value is GameKey {
  return value === "reaction" || value === "widow";
}

function asLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 10;
  return Math.max(1, Math.min(50, value));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);

  let payload: RankingPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  if (!isDiscordId(payload.guildId)) return json({ error: "invalid guild id" }, 400);
  if (!isGameKey(payload.gameKey)) return json({ error: "invalid game key" }, 400);

  const limit = asLimit(payload.limit);
  const { data, error } = await database
    .from("training_discord_scores")
    .select("discord_user_id, display_name, avatar_url, score, accuracy, avg_reaction_ms, headshot_rate, max_combo, updated_at")
    .eq("guild_id", payload.guildId)
    .eq("game_key", payload.gameKey)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) return json({ error: "failed to load server leaderboard" }, 500);

  return json({
    guildId: payload.guildId,
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
});
