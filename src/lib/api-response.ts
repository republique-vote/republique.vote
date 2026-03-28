import { NextResponse } from "next/server";

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

export interface PaginatedData<T> {
  currentPage: number;
  itemCount: number;
  itemLimit: number;
  items: T[];
  pageCount: number;
}

export interface PaginationOptions {
  limit?: number;
  page?: number;
}

export function getPaginationParams(
  searchParams: URLSearchParams
): PaginationOptions {
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

export function paginateArray<T>(
  items: T[],
  options: PaginationOptions
): PaginatedData<T> {
  const limit = options.limit || 20;
  const page = options.page || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);
  const itemCount = items.length;
  const pageCount = Math.ceil(itemCount / limit);

  return {
    items: paginatedItems,
    itemCount,
    itemLimit: limit,
    pageCount,
    currentPage: page,
  };
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
