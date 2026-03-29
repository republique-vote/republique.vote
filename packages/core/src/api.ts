export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}

export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  success: false;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedData<T> {
  currentPage: number;
  itemCount: number;
  itemLimit: number;
  items: T[];
  pageCount: number;
}

/**
 * Parse a fetch response as an API response.
 * Throws on HTTP errors or API errors.
 */
export async function parseApiResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      (body as ApiErrorResponse | null)?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }

  const json = (await res.json()) as ApiResponse<T>;

  if (!json.success) {
    throw new Error(json.message);
  }

  return json.data;
}
