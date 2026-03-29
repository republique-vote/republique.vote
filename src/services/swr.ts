import type { ApiResponse } from "@republique/core";

export class FetchError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

export async function fetcher<T>(
  key: string | [string, ...unknown[]]
): Promise<T> {
  const url = Array.isArray(key) ? key[0] : key;

  const res = await fetch(url);

  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new FetchError("Failed to fetch data", res.status, info);
  }

  const data: ApiResponse<T> = await res.json();

  if (!data.success) {
    throw new FetchError(
      "message" in data ? data.message : "API request failed",
      res.status,
      data
    );
  }

  return data.data;
}

export const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  dedupingInterval: 2000,
};
