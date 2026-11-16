import type { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { countPolls, type PollType } from "@/services/poll/list";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type") as PollType | null;
  return successResponse(await countPolls(type || null));
}
