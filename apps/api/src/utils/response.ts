import type { Context } from "hono";

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

export function ok<T>(c: Context, data: T, status = 200) {
  return c.json<ApiSuccess<T>>({ ok: true, data }, status as never);
}

export function fail(c: Context, code: string, message: string, status = 400) {
  return c.json<ApiFailure>({ ok: false, error: { code, message } }, status as never);
}
