export type TrainingGameKey = "reaction" | "widow";

export type TrainingProfile = {
  playerId: string;
  deviceSecret: string;
  nickname: string;
};

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
  nickname: string;
};

export type TrainingLeaderboardEntry = {
  rank: number;
  nickname: string;
  score: number;
  accuracy: number;
  avgReactionMs: number | null;
  headshotRate: number | null;
  maxCombo: number;
  updatedAt: string;
};

const PROFILE_KEY = "discord-random-defense:training-profile:v1";
const LEADERBOARD_ENDPOINT = "https://pbjjjggnudihwynixqai.supabase.co/functions/v1/training-leaderboard";

function makeSecret(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sanitizeNickname(value: string, playerId: string): string {
  const cleaned = value.replace(/[<>\u0000-\u001f\u007f]/g, "").trim().slice(0, 16);
  return cleaned.length >= 2
    ? cleaned
    : `훈련병-${playerId.replaceAll("-", "").slice(0, 4).toUpperCase()}`;
}

function createProfile(): TrainingProfile {
  const playerId = window.crypto.randomUUID();
  return {
    playerId,
    deviceSecret: makeSecret(),
    nickname: sanitizeNickname("", playerId),
  };
}

function isProfile(value: unknown): value is TrainingProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Partial<TrainingProfile>;
  return typeof profile.playerId === "string"
    && typeof profile.deviceSecret === "string"
    && profile.deviceSecret.length >= 32
    && typeof profile.nickname === "string";
}

function persistProfile(profile: TrainingProfile): TrainingProfile {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // 저장소 사용이 제한된 환경에서는 현재 세션에서만 유지된다.
  }
  return profile;
}

export function getTrainingProfile(): TrainingProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isProfile(parsed)) {
        const profile = {
          ...parsed,
          nickname: sanitizeNickname(parsed.nickname, parsed.playerId),
        };
        return persistProfile(profile);
      }
    }
  } catch {
    // 손상된 값은 새 프로필로 교체한다.
  }
  return persistProfile(createProfile());
}

export function updateTrainingNickname(nickname: string): TrainingProfile {
  const current = getTrainingProfile();
  return persistProfile({
    ...current,
    nickname: sanitizeNickname(nickname, current.playerId),
  });
}

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
  const profile = getTrainingProfile();
  const response = await fetch(LEADERBOARD_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: profile.playerId,
      deviceSecret: profile.deviceSecret,
      nickname: profile.nickname,
      ...input,
    }),
  });
  return readJson<TrainingScoreResult>(response);
}

export async function fetchTrainingLeaderboard(
  gameKey: TrainingGameKey,
  limit = 10,
): Promise<TrainingLeaderboardEntry[]> {
  const url = new URL(LEADERBOARD_ENDPOINT);
  url.searchParams.set("game", gameKey);
  url.searchParams.set("limit", String(limit));
  const response = await fetch(url, { method: "GET" });
  const payload = await readJson<{ entries: TrainingLeaderboardEntry[] }>(response);
  return payload.entries;
}
