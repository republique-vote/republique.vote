import type { NextRequest } from "next/server";
import {
  getPaginationParams,
  paginatedSuccessResponse,
} from "@/lib/api-response";
import {
  listPolls,
  type PollListStatus,
  type PollType,
} from "@/services/poll/list";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { page, limit } = getPaginationParams(params);

  return paginatedSuccessResponse(
    await listPolls({
      status: (params.get("status") as PollListStatus) || null,
      type: (params.get("type") as PollType) || null,
      sort: params.get("sort") === "votes" ? "votes" : "recent",
      page,
      limit,
    })
  );
}
