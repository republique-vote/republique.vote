import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { pollSummary, summaryReport } from "@/db/schema";
import { errorResponse, successResponse } from "@/lib/api-response";

const MAX_MESSAGE_LENGTH = 2000;

// Anonymous on purpose: reporting a wrong summary should not need an account
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const { pollId } = await params;
  const body = (await request.json().catch(() => null)) as {
    message?: unknown;
  } | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return errorResponse("missing_message", 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return errorResponse("message_too_long", 400);
  }

  const summary = await db.query.pollSummary.findFirst({
    where: eq(pollSummary.pollId, pollId),
  });
  if (!summary) {
    return errorResponse("summary_not_found", 404);
  }

  await db.insert(summaryReport).values({
    pollId,
    promptVersion: summary.promptVersion,
    message,
  });

  return successResponse({ reported: true }, 201);
}
