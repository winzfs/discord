import { isEmbeddedActivity } from "../../lib/activityMode";
import {
  ensureDiscordTrainingIdentity,
  getDiscordActivityGuildId,
  refreshDiscordTrainingIdentity,
  TRAINING_API_ENDPOINT,
  type DiscordTrainingIdentity,
} from "./discordIdentity";

const DIRECT_RANKING_API_ENDPOINT = "https://pbjjjggnudihwynixqai.supabase.co/functions/v1/training-ranking";
const ACTIVITY_RANKING_API_ENDPOINT = "/.proxy/training-api/training-ranking";
const TRAINING_RANKING_API_ENDPOINT = isEmbeddedActivity()
  ? ACTIVITY_RANKING_API_ENDPOINT
  : DIRECT_RANKING_API_ENDPOINT;

export type TrainingGameKey = "reaction" | "widow";

export type TrainingScoreInput = {
  gameKey: TrainingGameKey;
  score: number;
  accuracy: number;
  avgReactionMs?: number | null;
  headshotRate?: number | null;
  maxCombo: number;
};

export type TrainingScoreResult = {
  saved: boolean;
  improved: boolean;
  bestScore: number;
  rank: number;
  displayName: string;
};

export type TrainingLeaderboardEntry = {
  rank: number;
  discordUserId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  accuracy: number;
  avgReactionMs: number | null;
  headshotRate: number | null;
  maxCombo: number;
  updatedAt: string;
};

class TrainingApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "TrainingApiError";
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : `request failed: ${response.status}`;
    throw new TrainingApiError(message, response.status);
  }
  return payload as T;
}

async function postTrainingScore(
  identity: DiscordTrainingIdentity,
  input: TrainingScoreInput,
): Promise<TrainingScoreResult> {
  const response = await fetch(TRAINING_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit",
      guildId: identity.guildId,
      accessToken: identity.accessToken,
      ...input,
    }),
  });
  return readJson<TrainingScoreResult>(response);
}

export async function submitTrainingScore(input: TrainingScoreInput): Promise<TrainingScoreResult> {
  let identity = await ensureDiscordTrainingIdentity();
  try {
    return await postTrainingScore(identity, input);
  } catch (error) {
    if (!(error instanceof TrainingApiError) || (error.status !== 401 && error.status !== 403)) {
      throw error;
    }

    // Activity가 오래 열려 토큰이 만료된 경우 조용히 새 토큰을 받아 한 번만 재시도한다.
    identity = await refreshDiscordTrainingIdentity();
    return postTrainingScore(identity, input);
  }
}

export async function fetchTrainingLeaderboard(
  gameKey: TrainingGameKey,
  limit = 10,
): Promise<TrainingLeaderboardEntry[]> {
  const guildId = await getDiscordActivityGuildId();
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(TRAINING_RANKING_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, gameKey, limit }),
      });
      const payload = await readJson<{ entries: TrainingLeaderboardEntry[] }>(response);
      return payload.entries;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => window.setTimeout(resolve, 300));
    }
  }

  throw lastError;
}
