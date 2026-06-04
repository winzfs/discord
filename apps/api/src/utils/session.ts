import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "./env";
import { getEnvValue } from "./env";

const SESSION_COOKIE_NAME = "drd_session";
const STATE_COOKIE_NAME = "drd_oauth_state";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const STATE_TTL_SECONDS = 60 * 10;

type SessionPayload = {
  userId: string;
  discordId: string;
  isGuildMember: boolean;
  isAdmin: boolean;
  exp: number;
};

type StatePayload = {
  state: string;
  exp: number;
};

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signPayload(payload: string, secret: string) {
  const key = await importSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

async function encodeSignedPayload(payload: SessionPayload | StatePayload, secret: string) {
  const body = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(body, secret);
  return `${body}.${signature}`;
}

async function decodeSignedPayload<T extends SessionPayload | StatePayload>(value: string | undefined, secret: string): Promise<T | null> {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = await signPayload(body, secret);
  if (expected !== signature) return null;

  try {
    const json = new TextDecoder().decode(base64UrlDecode(body));
    const payload = JSON.parse(json) as T;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

export async function setOAuthStateCookie(c: Context<AppEnv>, state: string) {
  const secret = getEnvValue(c.env, "SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET is required");

  const value = await encodeSignedPayload(
    { state, exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS },
    secret,
  );
  setCookie(c, STATE_COOKIE_NAME, value, cookieOptions(STATE_TTL_SECONDS));
}

export async function verifyOAuthStateCookie(c: Context<AppEnv>, state: string | null) {
  const secret = getEnvValue(c.env, "SESSION_SECRET");
  if (!secret || !state) return false;

  const payload = await decodeSignedPayload<StatePayload>(getCookie(c, STATE_COOKIE_NAME), secret);
  return payload?.state === state;
}

export async function setSessionCookie(c: Context<AppEnv>, payload: Omit<SessionPayload, "exp">) {
  const secret = getEnvValue(c.env, "SESSION_SECRET");
  if (!secret) throw new Error("SESSION_SECRET is required");

  const value = await encodeSignedPayload(
    { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS },
    secret,
  );
  setCookie(c, SESSION_COOKIE_NAME, value, cookieOptions(SESSION_TTL_SECONDS));
}

export async function getSession(c: Context<AppEnv>) {
  const secret = getEnvValue(c.env, "SESSION_SECRET");
  if (!secret) return null;
  return decodeSignedPayload<SessionPayload>(getCookie(c, SESSION_COOKIE_NAME), secret);
}
