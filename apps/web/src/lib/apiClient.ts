export type ApiClientOptions = {
  baseUrl?: string;
};

export function createApiClient({ baseUrl = "/api" }: ApiClientOptions = {}) {
  return {
    async health() {
      const response = await fetch(`${baseUrl}/health`);
      return response.json() as Promise<{ ok: boolean; data?: unknown }>;
    },
  };
}

export const apiClient = createApiClient();
