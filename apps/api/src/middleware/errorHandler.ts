import type { ErrorHandler } from "hono";
import { fail } from "../utils/response";

export const errorHandler: ErrorHandler = (error, c) => {
  console.error(error);
  return fail(c, "internal_error", "요청 처리 중 오류가 발생했습니다.", 500);
};
