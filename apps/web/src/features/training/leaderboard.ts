import {
  ensureDiscordTrainingIdentity,
  TRAINING_API_ENDPOINT,
} from "./discordIdentity";

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

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : `request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function submitTrainingScore(input: TrainingScoreInput): Promise<TrainingScoreResult> {
  const identity = await ensureDiscordTrainingIdentity();
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

export async function fetchTrainingLeaderboard(
  gameKey: TrainingGameKey,
  limit = 10,
): Promise<TrainingLeaderboardEntry[]> {
  const identity = await ensureDiscordTrainingIdentity();
  const response = await fetch(TRAINING_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "leaderboard",
      guildId: identity.guildId,
      accessToken: identity.accessToken,
      gameKey,
      limit,
    }),
  });
  const payload = await readJson<{ entries: TrainingLeaderboardEntry[] }>(response);
  return payload.entries;
}
