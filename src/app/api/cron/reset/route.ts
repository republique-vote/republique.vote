import { env } from "env";
import type { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response";
import { resetAndSeed } from "@/services/reset";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return errorResponse("unauthorized", 401);
  }

  await resetAndSeed();

  return successResponse({ reset: true });
}
