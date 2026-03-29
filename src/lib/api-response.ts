import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  PaginatedData,
} from "@republique/core";
import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessResponse<T>>(
    { success: true, data },
    { status }
  );
}

export function errorResponse(message: string, statusCode: number) {
  return NextResponse.json<ApiErrorResponse>(
    { success: false, statusCode, message },
    { status: statusCode }
  );
}

export function paginatedSuccessResponse<T>(
  paginatedData: PaginatedData<T>,
  status = 200
) {
  return NextResponse.json<ApiSuccessResponse<PaginatedData<T>>>(
    { success: true, data: paginatedData },
    { status }
  );
}

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") || "1", 10)
  );
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("limit") || "20", 10))
  );
  return { page, limit };
}
