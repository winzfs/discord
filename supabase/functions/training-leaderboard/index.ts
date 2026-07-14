import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

type ScorePayload = {
  playerId?: unknown;
  deviceSecret?: unknown;
  nickname?: unknown;
  gameKey?: unknown;
  score?: unknown;
  accuracy?: unknown;
  avgReactionMs?: unknown;
  headshotRate?: unknown;
  maxCombo?: unknown;
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isGameKey(value: unknown): value is GameKey {
  return value === "reaction" || value === "widow";
}

function asInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function sanitizeNickname(value: unknown, playerId: string): string {
  const candidate = typeof value === "string"
    ? value.replace(/[<>\u0000-\u001f\u007f]/g, "").trim().slice(0, 16)
    : "";
  return candidate.length >= 2
    ? candidate
    : `훈련병-${playerId.replaceAll("-", "").slice(0, 4).toUpperCase()}`;
}

async function hashSecret(secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(secret);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validatePayload(payload: ScorePayload) {
  const playerId = typeof payload.playerId === "string" ? payload.playerId : "";
  const deviceSecret = typeof payload.deviceSecret === "string" ? payload.deviceSecret : "";
  const gameKey = payload.gameKey;
  const score = asInteger(payload.score);
  const accuracy = asInteger(payload.accuracy);
  const avgReactionMs = payload.avgReactionMs == null ? null : asInteger(payload.avgReactionMs);
  const headshotRate = payload.headshotRate == null ? null : asInteger(payload.headshotRate);
  const maxCombo = asInteger(payload.maxCombo) ?? 0;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(playerId)) {
    return { error: "invalid player id" } as const;
  }
  if (deviceSecret.length < 32 || deviceSecret.length > 256) {
    return { error: "invalid device secret" } as const;
  }
  if (!isGameKey(gameKey)) {
    return { error: "invalid game key" } as const;
  }
  const scoreLimit = gameKey === "reaction" ? 50_000 : 100_000;
  if (score === null || score < 0 || score > scoreLimit) {
    return { error: "invalid score" } as const;
  }
  if (accuracy === null || accuracy < 0 || accuracy > 100) {
    return { error: "invalid accuracy" } as const;
  }
  if (avgReactionMs !== null && (avgReactionMs < 50 || avgReactionMs > 10_000)) {
    return { error: "invalid average reaction" } as const;
  }
  if (headshotRate !== null && (headshotRate < 0 || headshotRate > 100)) {
    return { error: "invalid headshot rate" } as const;
  }
  if (maxCombo < 0 || maxCombo > 9_999) {
    return { error: "invalid combo" } as const;
  }

  return {
    value: {
      playerId,
      deviceSecret,
      nickname: sanitizeNickname(payload.nickname, playerId),
      gameKey,
      score,
      accuracy,
      avgReactionMs,
      headshotRate,
      maxCombo,
    },
  } as const;
}

async function getLeaderboard(gameKey: GameKey, limit: number): Promise<Response> {
  const { data, error } = await database
    .from("training_scores")
    .select("nickname, score, accuracy, avg_reaction_ms, headshot_rate, max_combo, updated_at")
    .eq("game_key", gameKey)
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) return response({ error: "failed to load leaderboard" }, 500);

  return response({
    gameKey,
    entries: (data ?? []).map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      score: row.score,
      accuracy: row.accuracy,
      avgReactionMs: row.avg_reaction_ms,
      headshotRate: row.headshot_rate,
      maxCombo: row.max_combo,
      updatedAt: row.updated_at,
    })),
  });
}

async function submitScore(payload: ScorePayload): Promise<Response> {
  const validation = validatePayload(payload);
  if ("error" in validation) return response({ error: validation.error }, 400);

  const value = validation.value;
  const secretHash = await hashSecret(value.deviceSecret);

  const { data: identity, error: identityError } = await database
    .from("training_scores")
    .select("device_secret_hash")
    .eq("player_id", value.playerId)
    .limit(1)
    .maybeSingle();

  if (identityError) return response({ error: "failed to validate player" }, 500);
  if (identity && identity.device_secret_hash !== secretHash) {
    return response({ error: "player verification failed" }, 403);
  }

  const { data: previous, error: previousError } = await database
    .from("training_scores")
    .select("score")
    .eq("player_id", value.playerId)
    .eq("game_key", value.gameKey)
    .maybeSingle();

  if (previousError) return response({ error: "failed to read current score" }, 500);

  const improved = !previous || value.score > previous.score;

  if (!previous) {
    const { error } = await database.from("training_scores").insert({
      player_id: value.playerId,
      device_secret_hash: secretHash,
      nickname: value.nickname,
      game_key: value.gameKey,
      score: value.score,
      accuracy: value.accuracy,
      avg_reaction_ms: value.avgReactionMs,
      headshot_rate: value.headshotRate,
      max_combo: value.maxCombo,
    });
    if (error) return response({ error: "failed to save score" }, 500);
  } else if (improved) {
    const { error } = await database
      .from("training_scores")
      .update({
        nickname: value.nickname,
        score: value.score,
        accuracy: value.accuracy,
        avg_reaction_ms: value.avgReactionMs,
        headshot_rate: value.headshotRate,
        max_combo: value.maxCombo,
        updated_at: new Date().toISOString(),
      })
      .eq("player_id", value.playerId)
      .eq("game_key", value.gameKey);
    if (error) return response({ error: "failed to update score" }, 500);
  } else {
    await database
      .from("training_scores")
      .update({ nickname: value.nickname })
      .eq("player_id", value.playerId)
      .eq("game_key", value.gameKey);
  }

  const bestScore = Math.max(previous?.score ?? 0, value.score);
  const { count, error: rankError } = await database
    .from("training_scores")
    .select("player_id", { count: "exact", head: true })
    .eq("game_key", value.gameKey)
    .gt("score", bestScore);

  if (rankError) return response({ error: "score saved but rank lookup failed" }, 500);

  return response({
    saved: true,
    improved,
    bestScore,
    rank: (count ?? 0) + 1,
    nickname: value.nickname,
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method === "GET") {
    const url = new URL(request.url);
    const gameKey = url.searchParams.get("game");
    if (!isGameKey(gameKey)) return response({ error: "invalid game key" }, 400);
    const limitValue = Number(url.searchParams.get("limit") ?? 10);
    const limit = Number.isFinite(limitValue) ? Math.max(1, Math.min(50, Math.floor(limitValue))) : 10;
    return getLeaderboard(gameKey, limit);
  }

  if (request.method === "POST") {
    let payload: ScorePayload;
    try {
      payload = await request.json();
    } catch {
      return response({ error: "invalid json" }, 400);
    }
    return submitScore(payload);
  }

  return response({ error: "method not allowed" }, 405);
});
