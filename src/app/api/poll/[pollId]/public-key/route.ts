import { NextRequest } from "next/server";
import { db } from "@/db";
import { poll } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateKeyPair } from "@/lib/blind-signature";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> },
) {
  const { pollId } = await params;

  const p = await db.query.poll.findFirst({
    where: eq(poll.id, pollId),
  });

  if (!p) {
    return errorResponse("poll_not_found", 404);
  }

  const keys = await getOrCreateKeyPair(pollId);

  return successResponse({ publicKey: keys.publicKey });
}
