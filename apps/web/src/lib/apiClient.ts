const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

function createApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function trimBodyPreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 90 ? `${normalized.slice(0, 90)}...` : normalized;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    throw new Error(`API 응답이 비어있습니다. HTTP ${response.status} ${response.url}`);
  }

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(rawText) as ApiResponse<T>;
  } catch {
    throw new Error(`API JSON 파싱 실패. HTTP ${response.status} ${response.url} 응답: ${trimBodyPreview(rawText)}`);
  }

  if (!response.ok || !payload.ok) {
    const message = payload.ok ? `API 요청 실패: ${response.status}` : payload.error.message;
    throw new Error(message);
  }

  return payload.data;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    credentials: "include",
  });
  return readApiResponse<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return readApiResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    method: "DELETE",
    credentials: "include",
  });
  return readApiResponse<T>(response);
}

export const apiClient = {
  health: () => apiGet<unknown>("/api/health"),
  me: () => apiGet<CurrentUser>("/api/me"),
  leaderboard: (limit = 20) => apiGet<LeaderboardData>(`/api/leaderboard?limit=${limit}`),
  adminSummary: () => apiGet<AdminSummary>("/api/admin/summary"),
};

export type CurrentUser = {
  id: string;
  discordId: string;
  isGuildMember: boolean;
  isAdmin: boolean;
  profile: {
    id: string;
    discordId: string;
    username: string;
    globalName?: string;
    avatarUrl?: string;
    isGuildMember: boolean;
    isAdmin: boolean;
  } | null;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  discordId: string;
  username: string;
  globalName?: string;
  avatarUrl?: string;
  mode: string;
  bestScore: number;
  bestWave: number;
  bestRunId: string;
  updatedAt: string;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  status: string;
};

export type AdminSummary = {
  status: string;
  totals: {
    users: number;
    gameRuns: number;
  };
  recentRuns: Array<{
    id: string;
    username: string;
    globalName?: string;
    score: number;
    wave: number;
    kills: number;
    bossKills: number;
    createdAt: string;
  }>;
  adminLogs: unknown[];
};
