import { DiscordSDK } from "@discord/embedded-app-sdk";
import { useSyncExternalStore } from "react";
import { isEmbeddedActivity } from "../../lib/activityMode";

const DIRECT_TRAINING_API_ENDPOINT = "https://pbjjjggnudihwynixqai.supabase.co/functions/v1/training-discord";
const ACTIVITY_TRAINING_API_ENDPOINT = "/.proxy/training-api/training-discord";

export const TRAINING_API_ENDPOINT = isEmbeddedActivity()
  ? ACTIVITY_TRAINING_API_ENDPOINT
  : DIRECT_TRAINING_API_ENDPOINT;

export type DiscordTrainingIdentity = {
  accessToken: string;
  guildId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type IdentityStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export type DiscordIdentityState = {
  status: IdentityStatus;
  identity: DiscordTrainingIdentity | null;
  message: string | null;
};

type ExchangeResponse = {
  accessToken: string;
  profile: {
    guildId: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

const listeners = new Set<() => void>();
let state: DiscordIdentityState = isEmbeddedActivity()
  ? { status: "idle", identity: null, message: null }
  : {
      status: "unavailable",
      identity: null,
      message: "Discord Activity에서 실행하면 서버 계정으로 랭킹에 연결됩니다.",
    };
let authenticationPromise: Promise<DiscordTrainingIdentity> | null = null;

function emit(nextState: DiscordIdentityState): void {
  state = nextState;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DiscordIdentityState {
  return state;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : `Discord 인증 요청 실패 (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function friendlyMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("guild required")) {
    return "서버 채널에서 훈련소 Activity를 실행해 주세요.";
  }
  if (message.includes("missing discord oauth configuration")) {
    return "Discord OAuth 환경변수를 확인해 주세요.";
  }
  if (message.includes("authorize") || message.includes("Authenticate")) {
    return "Discord 계정 권한 승인이 필요합니다.";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return "Discord Activity URL Mapping에서 training-api 연결을 확인해 주세요.";
  }
  return message || "Discord 계정 연결에 실패했습니다.";
}

async function authenticateDiscordIdentity(): Promise<DiscordTrainingIdentity> {
  if (!isEmbeddedActivity()) {
    throw new Error("Discord Activity에서만 계정 인증을 사용할 수 있습니다.");
  }

  const configResponse = await fetch(`${TRAINING_API_ENDPOINT}?action=config`, { method: "GET" });
  const { clientId } = await readJson<{ clientId: string }>(configResponse);
  if (!clientId) throw new Error("missing discord oauth configuration");

  const discordSdk = new DiscordSDK(clientId);
  await discordSdk.ready();

  const guildId = discordSdk.guildId;
  if (!guildId) throw new Error("guild required");

  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: ["identify", "guilds.members.read"],
  });

  const exchangeResponse = await fetch(TRAINING_API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "exchange", code, guildId }),
  });
  const exchange = await readJson<ExchangeResponse>(exchangeResponse);

  const authenticated = await discordSdk.commands.authenticate({
    access_token: exchange.accessToken,
  });
  if (!authenticated?.user?.id || authenticated.user.id !== exchange.profile.userId) {
    throw new Error("Discord Authenticate 명령이 실패했습니다.");
  }

  return {
    accessToken: exchange.accessToken,
    guildId: exchange.profile.guildId,
    userId: exchange.profile.userId,
    username: exchange.profile.username,
    displayName: exchange.profile.displayName,
    avatarUrl: exchange.profile.avatarUrl,
  };
}

export function ensureDiscordTrainingIdentity(): Promise<DiscordTrainingIdentity> {
  if (state.status === "ready" && state.identity) {
    return Promise.resolve(state.identity);
  }
  if (authenticationPromise) return authenticationPromise;

  emit({ status: "loading", identity: null, message: null });
  authenticationPromise = authenticateDiscordIdentity()
    .then((identity) => {
      emit({ status: "ready", identity, message: null });
      return identity;
    })
    .catch((error: unknown) => {
      emit({ status: "error", identity: null, message: friendlyMessage(error) });
      authenticationPromise = null;
      throw error;
    });

  return authenticationPromise;
}

export function retryDiscordTrainingIdentity(): void {
  authenticationPromise = null;
  emit({ status: "idle", identity: null, message: null });
  void ensureDiscordTrainingIdentity().catch(() => undefined);
}

export function useDiscordTrainingIdentity(): DiscordIdentityState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
