import type { AppEnv } from "../utils/env";

export function getDatabase(env: AppEnv["Bindings"]): D1Database | undefined {
  return env.DB;
}
