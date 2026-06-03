import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

export function ok<T>(c: Context, data: T, status: StatusCode = 200) {
  return c.json<ApiSuccess<T>>({ ok: true, data }, status);
}

export function fail(c: Context, code: string, message: string, status: StatusCode = 400) {
  return c.json<ApiFailure>({ ok: false, error: { code, message } }, status);
}
